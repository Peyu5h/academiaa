import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Checkbox } from "./ui/checkbox";
import { Loader2 } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const QuizMe: React.FC<{ extractedText: string }> = ({ extractedText }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY as string,
  );

  useEffect(() => {
    generateQuiz();
  }, [extractedText]);

  const generateQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setScore(null);
    setUserAnswers([]);
    setQuestions([]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Based on the following extracted text, generate 5 multiple-choice questions (MCQs) for a quiz. Each question should have 4 options, with only one correct answer. Format the output as follows:

      [
        {
          "question": "Question text here",
          "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          "correctAnswer": 0
        },
        // ... (4 more questions in the same format)
      ]

      The 'correctAnswer' field should be the index (0-3) of the correct option.

      Extracted text:
      ${extractedText}`;

      const result = await model.generateContent(prompt);
      const generatedQuestions = JSON.parse(result.response.text());
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
  };

  return (
    <div className="space-y-6 rounded-lg bg-gray-800 p-4 text-gray-200">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="text-orange-400 h-12 w-12 animate-spin" />
          <p className="text-lg font-medium">Generating your quiz...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900 text-red-200 rounded-lg p-4">
          <p>{error}</p>
          <Button
            onClick={generateQuiz}
            className="bg-orange-500 hover:bg-orange-600 mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-8">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="rounded-lg bg-gray-700 p-4 shadow">
              <p className="mb-4 text-lg font-semibold">{question.question}</p>
              <div className="space-y-3">
                {question.options.map((option, oIndex) => (
                  <label
                    key={oIndex}
                    className="flex cursor-pointer items-center space-x-3"
                  >
                    <Checkbox
                      checked={userAnswers[qIndex] === oIndex}
                      onCheckedChange={() => handleAnswerChange(qIndex, oIndex)}
                      className="bg-orange-500 border-orange text-orange"
                    />
                    <span className="text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={calculateScore} className="mt-6">
            Submit Answers
          </Button>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg">No quiz generated yet.</p>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={generateQuiz}
          >
            Generate Quiz
          </Button>
        </div>
      )}
      {score !== null && (
        <div className="mt-6 rounded-lg bg-gray-700 p-4">
          <p className="text-orange-400 text-lg font-bold">
            Your Score: {score} / {questions.length}
          </p>
        </div>
      )}
      {questions.length > 0 && (
        <Button
          onClick={generateQuiz}
          className="bg-orange-500 hover:bg-orange-600 mt-6"
        >
          Generate New Quiz
        </Button>
      )}
    </div>
  );
};

export default QuizMe;
