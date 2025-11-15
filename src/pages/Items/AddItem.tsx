// AddItem.tsx
import { useState, FormEvent, ChangeEvent, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import Spinner from "@/components/Spinner";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function AddItem() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [nameAr, setNameAr] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [price, setPrice] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch restaurants from the server
  const {
    data: restaurants,
    fetchNextPage: fetchNextPageRestaurants,
    hasNextPage: hasNextPageRestaurants,
    isFetching: isLoadingRestaurants,
    isFetchingNextPage: isFetchingNextPageRestaurants,
  } = useInfiniteQuery({
    queryKey: ["restaurant"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/restaurant?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  // Fetch categories based on selected restaurant
  const {
    data: categories,
    fetchNextPage,
    hasNextPage,
    isFetching: isLoadingCategories,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!restaurantId) return { items: [], hasNextPage: false };
      const response = await axiosInstance.get(
        `/category?restaurantId=${restaurantId}&page=${pageParam}`
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!restaurantId,
  });

  // Mutation for submitting the form
  const mutation = useMutation({
    mutationFn: (newItem: any) => {
      return axiosInstance.post(`/item`, newItem);
    },
    onError: (e) => {
      console.log(e);
    },
  });

  // Consolidated handleSubmit function using FormData
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: name.trim(),
      description: description.trim(),
      price: price,
      categoryId,
      image: base64Image,
    };

    try {
      // Create the item first
      await mutation.mutateAsync(itemData);
      
      // Add Arabic translations if provided
      const translationPromises = [];
      
      if (nameAr.trim()) {
        translationPromises.push(
          axiosInstance.post('/translation/add', {
            key: name.trim(),
            value: nameAr.trim(),
            language: 'ar'
          })
        );
      }
      
      if (descriptionAr.trim() && description.trim()) {
        translationPromises.push(
          axiosInstance.post('/translation/add', {
            key: description.trim(),
            value: descriptionAr.trim(),
            language: 'ar'
          })
        );
      }
      
      // Wait for all translations to be added
      if (translationPromises.length > 0) {
        await Promise.all(translationPromises);
      }
      
      navigate("/items");
    } catch (error) {
      console.error('Error creating item or adding translations:', error);
    }
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

        {/* Arabic Name */}
        <div className="mb-4">
          <label
            htmlFor="nameAr"
            className="block text-sm font-medium text-gray-700"
          >
            Arabic Name (Optional)
          </label>
          <input
            type="text"
            id="nameAr"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter Arabic item name"
            dir="rtl"
          />
        </div>

        {/* Arabic Description */}
        <div className="mb-4">
          <label
            htmlFor="descriptionAr"
            className="block text-sm font-medium text-gray-700"
          >
            Arabic Description (Optional)
          </label>
          <textarea
            id="descriptionAr"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter Arabic item description"
            dir="rtl"
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
          <Select 
            value={restaurantId} 
            onValueChange={(value) => {
              setRestaurantId(value);
              setCategoryId("");
            }} 
            disabled={isLoadingRestaurants}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {isLoadingRestaurants && !isFetchingNextPageRestaurants ? (
                  <SelectItem value="loading" disabled>
                    Loading restaurants...
                  </SelectItem>
                ) : restaurants?.pages.map((page) =>
                  page.items.map((restaurant: any) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))
                )}
                
                {hasNextPageRestaurants && (
                  <Button 
                    className="bg-white w-full p-1 text-center text-gray-600 active:opacity-80 hover:bg-gray-50" 
                    onClick={(e) => {
                      e.preventDefault();
                      fetchNextPageRestaurants();
                    }}
                    disabled={isFetchingNextPageRestaurants}
                  >
                    {isFetchingNextPageRestaurants ? 'Loading more...' : 'Load More'}
                  </Button>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Category Select */}
        <div className="mb-4">
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            Category
          </label>

          <Select 
            value={categoryId} 
            onValueChange={(value) => setCategoryId(value)} 
            disabled={!restaurantId || isLoadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {isLoadingCategories && !isFetchingNextPage ? (
                  <SelectItem value="loading" disabled>
                    Loading categories...
                  </SelectItem>
                ) : categories?.pages.map((page) =>
                  page.items.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
                
                {hasNextPage && (
                  <Button 
                    className="bg-white w-full p-1 text-center text-gray-600 active:opacity-80 hover:bg-gray-50" 
                    onClick={(e) => {
                      e.preventDefault();
                      fetchNextPage();
                    }}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                  </Button>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
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
