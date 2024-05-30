const userModel = require('../model/userModel')
const bcrypt = require('bcrypt')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto')
const orderModel = require('../model/orderModel')
const nodeMailer = require('nodemailer')
const cloudinary = require('../config/cloudinary')
const fs = require('fs')
const { generateAuthToken } = require("../middleware/userAuth");

const login=async(req,res)=>{
    try {
        console.log(req.body);
        const {email,password} = req.body
        if (!email || !password) {
            return res
              .status(400)
              .json({ msg: "Please provide both email and password" });
          }
          const userDetails = await userModel.findOne({
            email: email,
            is_purchased:true,
            is_blocked: false,
          });
      
          if (userDetails) {

            if(userDetails.is_loggedin){
            return res.status(400).json({ message: "User already logged in. Please log out and try again." });
            }
          
            const isMatch = await bcrypt.compare(password, userDetails.password);
            if (isMatch) {
              console.log('matched');
              const response = {
                user_id: null,
                token: null
              };
              response.token = generateAuthToken(userDetails);
              response.user_id = userDetails._id;
      
              await userModel.updateOne({_id:userDetails._id},{$set : {is_loggedin : true}})

              return res.status(200).json({ result : response,message:"Success"});
            } else {
              return res.status(400).json({ message:"Password incorrect!!"});
            }
          } else {
            return res.status(400).json({ message:"User not found!!"});
          }    
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Serverside error"})
    }
}

const generateTransactionID =()=>{
    const timstamp = Date.now()
    const randomNum = Math.floor(Math.random()*1000000)
    const merchantPrefix = 'T'
    const transaction_id = `${merchantPrefix}${timstamp}${randomNum}`
    return transaction_id 
}


const makePurchase =async(req,res)=>{
    try {
        const {firstName,lastName,email,mobile,amount,course,support,payment_method}= req.body
        if (!firstName || !lastName || !email || !mobile || !amount || !course || support === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const alreadyuser =  await userModel.findOne({email : email})

        let userData;

        if(!alreadyuser){

            userData = await userModel.create({
                firstName : firstName,
                lastName : lastName,
                email: email,
                mobile: mobile,
                join_date: Date.now()
            })
            userId = userData._id; 
        }else{
            userData = alreadyuser
        } 
        
        const image = req.files.uploadedFile[0]
        let imageUrl = null;
        if(image) {
            await cloudinary.uploader.upload(image.path)
            .then((data) => {
                imageUrl = data.secure_url;
            }).catch((err) => {
                res.status(500).json({ error: 'Error uploading image to Cloudinary.' });
            }).finally(()=>{
                fs.unlinkSync(image.path)
            })
        }else{
            res.status(400).json({message : "payment screenshot not included"})
        }

        if(imageUrl) {
            const transactionId = generateTransactionID()    
            // Create a new order
            const newOrder = await orderModel.create({
                transaction_id: transactionId,
                payment_method,
                payment_status: 'pending',
                user_email: email,
                amount,
                course,
                support,
                user_id: userData._id,
                date: Date.now(),
                screenshot : imageUrl
            });
        console.log(newOrder);
        res.status(200).json({order: newOrder ,message : "You have successfully made order"});    
        }else{
            res.status(500).json({ error: 'Internal server error.' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Serverside error"})
    }
}

const phonePePayment=async(req,res)=>{
    try {
        // const {email,amount,user_id} = req.body.data
        const email = 'rameesmohd789@gmail.com';
        const amount = 3;
        const number = 8547822807;

        const data = {
            merchantId: "PGTESTPAYUAT",
            merchantTransactionId: generateTransactionID(),
            merchantUserId: "MUID123",
            name: email,
            amount: amount * 100,
            redirectUrl: `${process.env.SERVER_BASE_URL}/api/phonepe/status?email=${email}`,
            redirectMode: "POST",
            mobileNumber: number,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const key = process.env.Salt_Key;
        const keyIndex = 1;
        const string = payloadMain + "/pg/v1/pay" + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;
        const URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

        const options = {
            method: 'post',
            url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            },
        };
        
        await axios.request(options)
            .then(function (response) {
                return res.status(200).send(response.data.data.instrumentResponse.redirectInfo.url);
            })
            .catch(function (error) {
                console.error('Axios request error:', error);
                res.status(500).json({ error: 'failed to process payment.' });
            });

        const response = await axiosInstance.post('', { request: payloadMain });

        return res.status(200).send(response.data.data.instrumentResponse.redirectInfo.url);           
    } catch (error) {
        console.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}

const phonePeStatus=async(req,res)=>{
    try {
        console.log('status');

        const {userid , email} = req.query
        const transaction_id = res.req.body.transactionId
        const merchantId = res.req.body.merchantId
        const keyIndex = 1
        const key = process.env.Salt_Key
        const string = `/pg/v1/status/${merchantId}/${transaction_id}` + key
        const sha256 = crypto.createHash('sha256').update(string).digest('hex')
        const checksum = sha256 + '###' + keyIndex

        const URL = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transaction_id}`
        // const URL = " https://api.phonepe.com/apis/hermes/pg/v1/status/MUID123/${merchantTransactionId}"
        
        const options = {
            method : 'GET',
            url : URL,
            headers : {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY' : checksum ,
                'X-MERCHANT-ID' : merchantId
            }
        }

        //CHECK PAYMENT STATUS 
        const response = await axios.request(options);

        console.log(response.data);
        const status = response.data.data.responseCode;
        if (status === 'SUCCESS') {
            const newOrder = new orderModel({
                transaction_id: transaction_id,
                payment_method: 'phonepe',
                payment_status: 'success',
                amount: response.data.data.amount / 100,
                date: new Date(),
                user_id: userid,
                user_email: email,
            });
            await newOrder.save();
            await userModel.updateOne({_id : userid},{$set:{is_purchased : true}})
            return res.redirect(`${process.env.CLIENT_BASE_URL}/my-course`);
        } else {
            console.log('Order not placed');
            return res.redirect(`${process.env.CLIENT_BASE_URL}/checkout`);
        }
    } catch (error) {
        console.error('Error creating chapter:', error);
        return res.status(500).json({ message: 'Internal server error.', status: 'failed' });
    }
}

module.exports = {
    login,
    makePurchase,
    phonePePayment,
    phonePeStatus
}

