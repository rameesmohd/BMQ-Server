const nodeMailer = require('nodemailer')
const userModel = require("../model/userModel");
const orderModel = require("../model/orderModel")
const bcrypt = require('bcrypt')
const secureRandomPassword = require('secure-random-password');
const {generateAuthToken} = require('../middleware/adminAuth')


const login = async( req,res)=>{
    try {
        const admin = await userModel.findOne({email : req.body.username,is_admin : true})
        console.log(req.body);
        console.log(admin);
        if(admin){
        const isMatch = await bcrypt.compare(req.body.password,admin.password);
        console.log(isMatch);
            if(isMatch){
                const token = generateAuthToken(admin);
                console.log(token);
                res.status(200).json({ token }) 
            }else{
                return res.status(400).json({ message:"Password incurrect!!"});
            }
        }else 
            res.status(400).json({message: 'Unauthorised access!!'})
    } catch (error) {
        console.log(error);
        res.status(500).json({}) 
    }
}

const fetchUsers=async(req,res)=>{
    try {
        const { search ,is_purchased ,is_completed}= req.query
        const searchQuery = {
            $or: [
            { name: { $regex: new RegExp(search, 'i') } }, 
            { email : { $regex: new RegExp(search, 'i') } }, 
            ]
        }
        const query = {
            ...(search !=='' && (isNaN(Number(search)) ? searchQuery : { mobile: Number(search) })),
            ...(is_purchased && { is_purchased }),
            ...(is_completed && { is_completed }),
            is_admin : false
        }
        const users = await userModel.find(query,{password : 0})
        res.status(200).json({result : users})
    } catch (error) {
        console.log(error);
        res.status(500).json({})
    }
}

const blockToggle=async(req,res)=>{
    try {
        console.log(req.body);
        const {id,currStatus} = req.body
        await userModel.updateOne({_id : id},{$set : {is_blocked : !currStatus}})
        res.status(200).json({})
    } catch (error) {
        console.log(error);
        res.status(500).json({})
    }
}

const fetchOrder =async(req,res)=>{
    try {
        const {timeframe,filter,search,from : dateFrom,to : toDate} = req.query
        const findQuery = {};
        console.log(req.query);
        if(filter === 'success' || filter === 'rejected' || filter === 'pending'){
            findQuery.payment_status = filter 
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);
        if (dateFrom && toDate) {
            findQuery.date = { $gte: dateFrom, $lte: toDate };
        }
        if (timeframe === 'daily') {
            findQuery.date = { $gte: today, $lte: tomorrow };
        } else if (timeframe === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            findQuery.date = { $gte: lastWeek };
        } else if (timeframe === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            findQuery.date = { $gte: lastMonth };
        }

        if(search){
            const searchQuery = {
                $or: [
                    { transaction_id: { $regex: new RegExp(search, 'i') } }, 
                    { email : { $regex: new RegExp(search, 'i') } }, 
                ]
            }
            Object.assign(findQuery, searchQuery);
        }    
        console.log(findQuery,'findQuery');
        const orderData = await orderModel.find(findQuery).sort({date : -1})
        res.status(200).json({result : orderData})
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Server side error!"})
    }
}

const generatePass = ()=>{
    const password = secureRandomPassword.randomPassword({
        characters: secureRandomPassword.lower + secureRandomPassword.upper + secureRandomPassword.digits + secureRandomPassword.symbols,
        length: 10,
        strict: true
    });
    return password
}

const handleOrder=async(req,res)=>{
    try {
        const {orderId,action}=req.body
        const status = action===1 ? 'success' : action===2 ? 'rejected' : ''
        const updatedOrder = await orderModel.findOneAndUpdate(
            {_id : orderId},
            {$set : {payment_status : status}},
            {new : true}
        )
        if(status=='success'){
            const user = await userModel.findOne({_id : updatedOrder.user_id})
            console.log(user);
            let newPass = generatePass()
            const hashpassword = await bcrypt.hash(newPass, 10);
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
                                to:user.email,
                                subject:'Success mail',
                                html:`<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                                <div style="margin:50px auto;width:90%;padding:10px 0">
                                <div style="border-bottom:1px solid #009b1a">
                                    <a href="" style="font-size:1.4em;color: #000000;text-decoration:none;font-weight:600">Welcome to Beatmarketedu.</a>
                                </div>
                                <p style="font-size:1.1em">Hi ${user.firstName},</p>
                                <p>We have received your payment in full for the recent invoice. 
                                    Thank you for the prompt settlement.<br/> We greatly appreciate your
                                    purchase and are here to assist you should you have any further requirements.</p>
                                    <div style="background-color: #f0f1ff; padding: 10px; width: 80%;">
                                    <h2>Your login credentials :</h2>    
                                    <div style="border: black; flex: auto; flex-direction: row; justify-content: space-between;">
                                        <h5>Username : ${user.email}</h5>
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
       
            await userModel.updateOne(
                { _id: updatedOrder.user_id },
                { $set: { is_purchased: true, password: hashpassword } }
            );
        }
        res.status(200).json({result : updatedOrder})
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Server side error!"})
    }
}

module.exports = {
    login,
    fetchUsers,
    blockToggle,
    fetchOrder,
    handleOrder
}