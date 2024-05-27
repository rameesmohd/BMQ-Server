const secureRandomPassword = require('secure-random-password');
const userModel = require('../model/userModel')
const bcrypt = require('bcrypt')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto')
const orderModel = require('../model/orderModel')
const nodeMailer = require('nodemailer')

const generateTransactionID =()=>{
    const timstamp = Date.now()
    const randomNum = Math.floor(Math.random()*1000000)
    const merchantPrefix = 'T'
    const transaction_id = `${merchantPrefix}${timstamp}${randomNum}`
    return transaction_id 
}
const generatePass = ()=>{
    const password = secureRandomPassword.randomPassword({
        characters: secureRandomPassword.lower + secureRandomPassword.upper + secureRandomPassword.digits + secureRandomPassword.symbols,
        length: 10,
        strict: true
    });
    return password
}

const makePurchase =async(req,res)=>{
    try {
        const {firstName,lastName,email,mobile,amount,course,support}= req.body.data
        if (!firstName || !lastName || !email || !mobile || !amount || !course || support === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const alreadyuser =  await userModel.findOne({email : email})

        let userId;
        let userData;
        if(!alreadyuser){
        const newPass = generatePass()
        const hashpassword = await bcrypt.hash(newPass, 10);
            // Create a new user
            userData = await userModel.create({
                firstName : firstName,
                lastName : lastName,
                email: email,
                password: hashpassword,
                mobile: mobile,
                join_date: Date.now()
            })
            userId = userData._id; 
        }else {
            userData = alreadyuser
            userId = alreadyuser._id
        } 

        const transactionId = generateTransactionID()

        // Create a new order
        const newOrder = await orderModel.create({
            transaction_id: transactionId,
            payment_method: 'phonepe',
            payment_status: 'success',
            user_email: email,
            amount,
            course,
            support,
            user_id: userId,
            date: Date.now()
        });
        
        if(!alreadyuser){
            try {
                const transporter = nodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:465,
            secure:true,
            require:true,
            auth:{
                user:process.env.OFFICIALMAIL,
                pass :process.env.OFFICIALMAILPASS
            }
        })

        const mailOptions = {
            from : process.env.OFFICIALMAIL,
            to:email,
            subject:'Success mail',
            html:`<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #009b1a">
                <a href="" style="font-size:1.4em;color: #000000;text-decoration:none;font-weight:600">Welcome to Beatmarketedu.</a>
            </div>
            <p style="font-size:1.1em">Hi ${firstName},</p>
            <p>We have received your payment in full for the recent invoice. 
                Thank you for the prompt settlement.<br/> We greatly appreciate your
                purchase and are here to assist you should you have any further requirements.</p>
                <div style="background-color: #f0f1ff; padding: 10px; width: 50%;">
                <h2>Your login credentials :</h2>    
                <div style="border: black; flex: auto; flex-direction: row; justify-content: space-between;">
                    <h5>Username : ${email}</h5>
                    <h5>Password : ${newPass}</h5>
                    <a href='https://xxxxxxxx/my-course' style="background: #00466a;margin: 0 auto;width: max-content;padding: 5 10px;
                    color: #fff;border-radius: 4px;">Go to course</a>
                    </div>
                </div>  
            <p style="font-size:0.9em;">Regards,<br />Beat Market Edu</p>
            <hr style="border:none;border-top:1px solid #eee" />
            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Beatmarketedu.</p>
                </div>
                </div>
                </div>`
        }

        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
                return false
            }else{
                console.log("Email has been sent :- ",info.response);
                return true
            }
        }) 
        } catch (error) {
            console.log(error,"nodemailer");
            res.status(500).json({message : "Error while sending mail!!"})
        }
    }
    res.status(200).json({ user: userData, order: newOrder ,message : "You have successfully made the purchase"});
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
    makePurchase,
    phonePePayment,
    phonePeStatus
}

