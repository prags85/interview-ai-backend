const User=require("../models/User")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")


// Generate JWT Token

const generateToken=(userId)=>{
    return jwt.sign({id:userId},process.env.JWT_SECRET,{expiresIn:"7d"});

}

// @desc  Register a new user
//@route  POST/api/auth/register
// @access Public

const registerUser=async(req,res)=>{
    try {
        const {name,email,password,profileImageUrl}=req.body

        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).json({
                message:"User already exist"
            })
        }
        // Hash Password
        const salt=await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

const user = await User.create({
  name,
  email,
  password: hashedPassword, // ✅ Save hashed password
  profileImageUrl
});
        //Return user with JWT
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            profileImageUrl:user.profileImageUrl,
            token:generateToken(user._id),
        });
        
    } catch (error) {
        res.status(500).json({message:"Server error",error:error.message})
        
    }

}

// @desc login user
//@route  POST/api/auth/login
// @access Public
const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        token: generateToken(user._id),
      });
  
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  

// @desc get user profile
//@route  POST/api/auth/profile
// @access Private(Requires JWT)

const getUserProfile=async(req,res)=>{
    try {
        const user=await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(400).json({
                message:"User do not found"
            })
        }
        res.json(user);
        
    } catch (error) {
        res.status(500).json({message:"Server error",error:error.message})
        
    }


}


module.exports={registerUser,loginUser,getUserProfile}