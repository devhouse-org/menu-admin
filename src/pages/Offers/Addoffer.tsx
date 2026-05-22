import React, { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const Addoffer = () => {
  const [title, setTitle] = useState("");
  const [withEmoji, setWithEmoji] = useState("");
  const [description, setDescription] = useState(""); 
  const [uploadImageBase64, setUploadImageBase64] = useState<string | null>(null); // Store base64 image
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false); 
  const [autoTitle, setAutoTitle] = useState(false); // State for auto title checkbox
  const navigate = useNavigate();

  function removeMarkdownPreserveEmojis(input: string) {
    let result = input.replace(/^(#{1,6})\s+/gm, "");
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1"); 
    result = result.replace(/\*([^*]+)\*/g, "$1"); 
    result = result.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); 
    result = result.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1"); 
    result = result.replace(/```[\s\S]*?```/g, ""); 
    result = result.replace(/`([^`]+)`/g, "$1"); 
    result = result.replace(/^\s*[-*+]\s+/gm, ""); 
    result = result.replace(/^\s*\d+\.\s+/gm, ""); 
    result = result.replace(/^>\s+/gm, "");
    result = result.replace(/^\s*[-*]{3,}\s*$/gm, "");
    return result.trim();
  }

  const generateDescription = async (title: string) => {
    // The Gemini API key MUST NOT live in the browser bundle.
    // Read it from a Vite env var so it can be omitted in production
    // builds, or proxy the call through the backend.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      alert(
        "AI generation is disabled. Set VITE_GEMINI_API_KEY in your env, " +
          "or proxy this call through the backend."
      );
      return "";
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `create, complete and enhance this offer: ${title} ${withEmoji}`,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const generatedContent =
        response.data.candidates[0].content.parts[0].text;
      setLoading(false);
      return removeMarkdownPreserveEmojis(generatedContent);
    } catch (error) {
      console.error("Error generating description: ", error);
      setLoading(false);
      return "";
    }
  };

  const mutation = useMutation({
    mutationFn: (newoffer: any) => {
      return axiosInstance.post(`/offers`, newoffer);
    },
    onSuccess: () => {
      navigate("/offers");
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newOffer = {
      title,
      description,
      image: uploadImageBase64, // Send Base64 encoded image as string
    };

    mutation.mutate(newOffer);
  };

  const handleGenerateDescription = async () => {
    if (title) {
      const generatedDescription = await generateDescription(title);
      setDescription(generatedDescription); 
    } else {
      alert("Please enter a title to generate a description.");
    }
  };

  const handleAutoTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAutoTitle(isChecked);

    if (isChecked) {
      setWithEmoji("with emojis");
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadImageBase64(reader.result as string); // Convert image to base64
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Offer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <div className="mt-2">
            <label>
              <input
                type="checkbox"
                checked={autoTitle}
                onChange={handleAutoTitleChange}
              />{" "}
              Add emojis
            </label>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGenerateDescription}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Generating Description..." : "Generate Description"}
          </button>
        </div>

        <div>
          <label className="block font-bold mb-2">Add Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="You can add or edit the description here..."
          />
        </div>

        <div className="mb-4">
          {uploadImageBase64 && (
            <div className="p-4">
              <img width={100} src={uploadImageBase64} alt="" />
            </div>
          )}
          <input
            type="file"
            id="upload-image"
            onChange={(e) => {
              if (e.target.files) {
                handleImageUpload(e.target.files[0]); // Handle image upload as base64
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 disabled:animate-pulse disabled:bg-indigo-300 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding... " : "Add Offer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Addoffer;
