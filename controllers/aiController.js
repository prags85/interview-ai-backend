const {GoogleGenAI}=require("@google/genai")

const {conceptExplainPrompt, questionAnswerPrompt}=require("../utils/prompts")

const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

// @desc    generate interview questions and answers using Gemini
//@route   POST/api/ai/generate-questions
//@access  Private

const generateInterviewQuestions = async (req, res) => {
    try {
      const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
  
      if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numberOfQuestions);
  
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
      });
  
      let rawText = response.text;
  
      const cleanedText = rawText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
  
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (err) {
        console.error("❌ JSON parse failed:", err.message);
        console.log("🔍 Raw text from Gemini:", cleanedText);
        return res.status(500).json({ message: "Invalid JSON from AI", error: err.message });
      }
  
      // Validate if data is an array of questions
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Questions not generated properly." });
      }
  
      return res.status(200).json({ questions: data });
  
    } catch (error) {
      console.error("❌ Failed to generate questions:", error.message);
      res.status(500).json({
        message: "Failed to generate questions",
        error: error.message,
      });
    }
  };
  
  

// @desc   Generate expalins a interview question
//@route   POST/api/ai/generate-explanation
//@access  Private

const generateConceptExplanation=async(req,res)=>{
    try {
        const {question}=req.body;

        if(!question){
            return res.status(400).json({message:"Required field is missing"})
        }
        const prompt =conceptExplainPrompt(question);
        const response=await ai.models.generateContent({
            model:"gemini-2.0-flash-lite",
            contents:prompt
        })

        let rawText=response.text;
        // clean it : Remove ```json and ``` from begining

        const cleanedText=rawText
        .replace(/^```json\s*/,"")
        .replace(/```$/,"")
        .trim();
// Now safe to parse
const data=JSON.parse(cleanedText);
res.status(200).json(data)

        
    } catch (error) {
        res.status(500).json({
            message:"Failed to generate questions",
            error:error.message
        })
        
    }
};

module.exports={generateInterviewQuestions,generateConceptExplanation};


