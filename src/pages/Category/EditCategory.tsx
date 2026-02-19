import axiosInstance from "@/axiosInstance";
import Spinner from "@/components/Spinner";
import IconSelector from "@/components/IconSelector";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

type categoryType = {
  name: string;
  restaurantId: string;
  icon?: string;
  orderNumber?: number;
};

function EditCategory() {
  const location = useLocation();
  const record = location.state;
  const [name, setName] = useState<string>(record.name || "");
  const [restaurantId, setRestaurantId] = useState<string>(record.restaurantId || "");
  const [icon, setIcon] = useState<string | null>(record.icon || null);
  const [orderNumber, setOrderNumber] = useState<string>(
    record.orderNumber != null ? String(record.orderNumber) : ""
  );
  const { categoryId } = useParams();
  const navigate = useNavigate();

  // Fetch restaurants from the server
  const {
    data: restaurants,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const response = await axiosInstance.get("/restaurant");
      return response.data;
    },
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
      name,
      restaurantId,
    };

    // Only include icon if selected
    if (icon) {
      newEdit.icon = icon;
    }

    // Only include orderNumber if provided
    if (orderNumber !== "") {
      newEdit.orderNumber = Number(orderNumber);
    }

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
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
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

        {/* Restaurant Select */}
        <div className="mb-4">
          <label
            htmlFor="restaurantId"
            className="block text-sm font-medium text-gray-700"
          >
            Restaurant
          </label>
          <select
            id="restaurantId"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="" disabled>
              Select a restaurant
            </option>
            {restaurants && restaurants?.items.length > 0 ? (
              restaurants?.items.map((restaurant: any) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No restaurants available
              </option>
            )}
          </select>
        </div>

        {/* Icon Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Icon (Optional)
          </label>
          <div className="flex items-center gap-2">
            <IconSelector
              onIconSelect={handleIconSelect}
              initialIcon={icon ?? undefined}
            />
            {icon && (
              <button
                type="button"
                onClick={() => setIcon(null)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Clear Icon
              </button>
            )}
          </div>
        </div>

        {/* Order Number */}
        <div className="mb-4">
          <label
            htmlFor="orderNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Order Number
          </label>
          <input
            type="number"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Category display order"
            min={1}
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