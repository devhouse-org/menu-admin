import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Spinner from "@/components/Spinner"; // Assuming you have a Spinner component for loading states
import axiosInstance from "@/axiosInstance";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type questionType = {
  title: string | null;
  enTitle: string | null;
  description: string | null;
  restaurantId: string | null;
  answers: string | null;
};

function EditQuestion() {
  const location = useLocation();
  const record = location.state || {};
  const [description, setDescription] = useState<string | null>(
    record.description ?? null
  );
  const [restaurantId, setRestaurantId] = useState<string | null>(
    record.restaurantId ?? null
  );
  // The Prisma column is `answers` (plural). The previous code used
  // `answer` here, so any edit submission silently dropped the field on
  // the server and corrupted JSON data on subsequent saves.
  const [answers, setAnswers] = useState<string | null>(
    record.answers ?? null
  );
  const [title, setTitle] = useState<string | null>(record.title ?? null);
  const [enTitle, setEnTitle] = useState<string | null>(record.enTitle ?? null);
  const { questionId } = useParams();
  const navigate = useNavigate();

  // Fetch restaurants from API
  const {
    data: restaurants,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["restaurants"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/restaurant?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
  });

  const mutation = useMutation({
    mutationFn: (newEdit: questionType) => {
      return axiosInstance.put(`/question/${questionId}`, newEdit);
    },
    onSuccess: () => {
      navigate("/questions"); // Navigate back to the questions list after successful edit
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, enTitle, description, restaurantId, answers });
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) return <div>Error loading restaurants</div>;

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Edit Question</h2>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title || ""}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter title"
            required
          />
        </div>

        {/* English Title */}
        <div className="mb-4">
          <label
            htmlFor="entitle"
            className="block text-sm font-medium text-gray-700"
          >
            English Title
          </label>
          <input
            type="text"
            id="EnTitle"
            value={enTitle || ""}
            onChange={(e) => setEnTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter English title"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter question description"
          />
        </div>

        {/* Answer
        <div className="mb-4">
          <label
            htmlFor="answer"
            className="block text-sm font-medium text-gray-700"
          >
            Answer
          </label>
          <input
            type="text"
            id="answer"
            value={answer || ""}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter answer"
            required
          />
        </div> */}

        {/* Restaurant Select */}
        <div className="mb-4">
          <label
            htmlFor="restaurantId"
            className="block text-sm font-medium text-gray-700"
          >
            Restaurant
          </label>
          <Select 
            value={restaurantId || ""} 
            onValueChange={setRestaurantId}
            key={restaurantId || "no-value"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants?.pages.map((page) =>
                page.items.map((restaurant: any) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))
              )}
              {hasNextPage && (
                <Button
                  className="w-full text-center text-gray-600"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchNextPage();
                  }}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600  disabled:animate-pulse disabled:bg-indigo-300 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditQuestion;
