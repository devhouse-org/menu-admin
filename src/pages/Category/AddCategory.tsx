import axiosInstance from "@/axiosInstance";
import IconSelector from "@/components/IconSelector";
import Spinner from "@/components/Spinner";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateCategoryDto = {
  name: string;
  icon?: string | null;
  restaurantId: string;
  orderNumber?: number | null;
};

function AddCategory() {
  const [name, setName] = useState<string>("");
  const [nameAr, setNameAr] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [icon, setIcon] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const navigate = useNavigate();

  // Update to use infinite query for restaurants
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
    mutationFn: (newCategory: CreateCategoryDto) => {
      return axiosInstance.post(`/category`, newCategory);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCategory: CreateCategoryDto = {
      name: name.trim(),
      restaurantId,
      icon: icon || null,
      orderNumber: orderNumber,
    };

    try {
      // Create the category first
      await mutation.mutateAsync(newCategory);
      
      // Add Arabic translation if provided
      if (nameAr.trim()) {
        try {
          await axiosInstance.post('/translation/add', {
            key: name.trim(),
            value: nameAr.trim(),
            language: 'ar'
          });
        } catch (error) {
          console.error('Error adding translation:', error);
        }
      }
      
      navigate("/categories");
    } catch (error) {
      console.error('Error creating category or adding translation:', error);
    }
  };

  const handleIconSelect = (title: string) => {
    setIcon(title);
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
      <h2 className="text-2xl font-bold mb-6">Add Category</h2>

      <form onSubmit={handleSubmit}>
        {/* Category Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Arabic Name */}
        <div className="mb-4">
          <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700">
            Arabic Name (Optional)
          </label>
          <input
            type="text"
            id="nameAr"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter Arabic category name"
            dir="rtl"
          />
        </div>

        {/* Restaurant Select */}
        <div className="mb-4">
          <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700">
            Restaurant
          </label>
          <Select value={restaurantId} onValueChange={setRestaurantId}>
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

        {/* Order Number */}
        <div className="mb-4">
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">
            Order Number
          </label>
          <input
            type="number"
            id="orderNumber"
            value={orderNumber || ""}
            onChange={(e) => setOrderNumber(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter display order number"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 disabled:animate-pulse disabled:bg-indigo-300 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding... " : "Add Category"}
          </button>
        </div>

        <IconSelector onIconSelect={handleIconSelect} />
      </form>
    </div>
  );
}

export default AddCategory;
