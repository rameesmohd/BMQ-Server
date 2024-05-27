const nodeMailer = require('nodemailer')
const userModel = require("../model/userModel");

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

module.exports = {
    fetchUsers,
    blockToggle
}