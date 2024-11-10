import axiosInstance from "@/axiosInstance";
import Spinner from "@/components/Spinner";
import IconSelector from "@/components/IconSelector";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type categoryType = {
  name: string | null;
  restaurantId: string | null;
  icon?: string | null;
  orderNumber?: number | null;
};

function EditCategory() {
  const location = useLocation();
  const record = location.state;
  const [name, setName] = useState<string | null>(record.name);
  const [restaurantId, setRestaurantId] = useState<string | null>(record.restaurantId);
  const [icon, setIcon] = useState<string | null>(record.icon || null);
  const [orderNumber, setOrderNumber] = useState<number | null>(record.orderNumber || null);
  const { categoryId } = useParams();
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
    mutationFn: (newEdit: categoryType) => {
      return axiosInstance.put(`/category/${categoryId}`, newEdit);
    },
    onSuccess: () => {
      navigate("/categories");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEdit: categoryType = {
      name: name?.trim() || "",
      restaurantId,
      icon: icon || null,
      orderNumber: orderNumber,
    };

    mutation.mutate(newEdit);
  };

  const handleIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon);
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
      <h2 className="text-2xl font-bold mb-6">Edit Category</h2>

      <form onSubmit={handleSubmit}>
        {/* Category Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Restaurant Select */}
        <div className="mb-4">
          <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700">
            Restaurant
          </label>
          <Select value={restaurantId || ""} onValueChange={setRestaurantId}>
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

        {/* Icon Selector */}
        <div className="mb-4">
          <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
            Select Icon
          </label>
          <IconSelector
            onIconSelect={handleIconSelect}
            initialIcon={icon ?? undefined}
          />
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
            {mutation.isPending ? "Saving... " : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditCategory;