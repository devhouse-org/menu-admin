// AddItem.tsx
import { useState, FormEvent, ChangeEvent, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import Spinner from "@/components/Spinner";
import { Progress } from "@/components/ui/progress";

function AddItem() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const navigate = useNavigate();

  // Fetch restaurants from the server
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const response = await axiosInstance.get("/restaurant");
      return response.data;
    },
  });

  // Fetch categories based on selected restaurant
  const {
    data: categories,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching:isLoadingCategories,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["categories-infinite", restaurantId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!restaurantId) return [];
      const response = await axiosInstance.get(
        `/category?restaurantId=${restaurantId}&page=${pageParam}` // Ensure to include pagination
      );
      return response.data;
    },
    enabled: !!restaurantId,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    initialPageParam: 1, // Add this line
  });

  // Mutation for submitting the form
  const mutation = useMutation({
    mutationFn: (newItem: any) => {
      return axiosInstance.post(`/item`, newItem);
    },
    onError: (e) => {
      console.log(e);
    },
    onSuccess: () => {
      navigate("/items");
    },
  });

  // Consolidated handleSubmit function using FormData
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const itemData = {
      name,
      description,
      price: price,
      categoryId,
      image: base64Image,
    };

    mutation.mutate(itemData);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadImage(file);
      setUploadImageUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleScroll = () => {
    const select = selectRef.current;
    if (select) {
      const atBottom = select.scrollTop + select.clientHeight >= select.scrollHeight;
      if (atBottom) {
        console.log("next")
        fetchNextPage();
      }
    }
  };
  if (isLoadingRestaurants) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  console.log("cat", categories)

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Add Item</h2>
      <form onSubmit={handleSubmit}>
        {/* Item Name */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Item Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter item name"
            required
          />
        </div>

        {/* Item Price */}
        <div className="mb-4">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Item Price
          </label>
          <input
            type="number"
            id="price"
            value={price !== null ? price : ""}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter price"
            required
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter item description"
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
            onChange={(e) => {
              setRestaurantId(e.target.value);
              setCategoryId("");
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="" disabled>
              Select a restaurant
            </option>
            {restaurants?.items?.map((restaurant: any) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div className="mb-4">
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
          ref={selectRef}
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={!restaurantId || isLoadingCategories}
          >
            <option value="" disabled>
              {isLoadingCategories
                ? "Loading categories..."
                : "Select a category"}
            </option>
            {categories?.pages?.length > 0 ? (
              categories.pages.flatMap((page: any) => page?.items || []).map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No categories available
              </option>
            )}
          </select>
        </div>

        {/* Upload Image */}
        <div className="mb-4">
          <div className="flex gap-4 flex-wrap items-center">
            <label
              htmlFor="upload-image"
              className="block text-sm font-medium text-gray-700"
            >
              Upload image
            </label>
            {progress > 0 && name && uploadImage && (
              <div className="flex items-center gap-1">
                <h1 className="text-gray-400 ">{progress}</h1>
                <Progress value={progress} max={100} className="h-2 w-24 " />
              </div>
            )}
          </div>
          {uploadImageUrl ? (
            <div className="p-4">
              <img width={100} src={uploadImageUrl} alt="" />
            </div>
          ) : null}
          <input
            type="file"
            id="upload-image"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 disabled:animate-pulse disabled:bg-indigo-300 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding... " : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddItem;
