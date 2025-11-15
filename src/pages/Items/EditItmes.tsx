import axiosInstance from "@/axiosInstance";
import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useState, FormEvent, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { toBase64 } from "@/utils/imageUtils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type itemType = {
  name: string | null;
  description: string | null;
  price: number | null;
  categoryId: string | null;
  image: string | null;
};

function EditItem() {
  const location = useLocation();
  const record = location.state;
  const { itemId } = useParams();

  // Fetch item data based on itemId
  const {
    data: itemData,
    isLoading: isLoadingItem,
    isError: isErrorItem,
  } = useQuery({
    queryKey: ["item", itemId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/item/${itemId}`);
      return response.data;
    },
  });

  // Initialize state with fetched item data
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState<string | null>(null);
  const [descriptionAr, setDescriptionAr] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Effect to set state when itemData is fetched
  useEffect(() => {
    if (itemData) {
      setName(itemData.name);
      setDescription(itemData.description);
      // Translations are stored in the translation files, not in the item data
      // So we initialize these as empty - user can add translations if needed
      setNameAr(null);
      setDescriptionAr(null);
      setPrice(itemData.price);
      setUploadImageUrl(itemData.image);
      setCategoryId(itemData.categoryId);
      setRestaurantId(itemData.category.restaurantId);
    }
  }, [itemData]);

  const navigate = useNavigate();

  // Fetch restaurants with infinite query
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

  // Fetch categories with infinite query
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

  const mutation = useMutation({
    mutationFn: (data: any) => {
      return axiosInstance.put(`/item/${itemId}`, data);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    let imageBase64 = uploadImageUrl;

    if (uploadImage) {
      imageBase64 = await toBase64(uploadImage);
    }

    const data = {
      name: name?.trim() || "",
      description: description?.trim() || "",
      price: price || 0,
      categoryId: categoryId || "",
      image: imageBase64,
    };

    try {
      // Update the item first
      await mutation.mutateAsync(data);
      
      // Add Arabic translations if provided
      const translationPromises = [];
      
      if (nameAr?.trim()) {
        translationPromises.push(
          axiosInstance.post('/translation/add', {
            key: name?.trim() || '',
            value: nameAr.trim(),
            language: 'ar'
          })
        );
      }
      
      if (descriptionAr?.trim() && description?.trim()) {
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
      console.error('Error updating item or adding translations:', error);
    }
  };

  if (isLoadingRestaurants || isLoadingItem) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isErrorItem) return <div>Error loading item data</div>;

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Edit Item</h2>

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
            value={name || ""}
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
            onChange={(e) => setPrice(parseFloat(e.target.value))}
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
            value={description || ""}
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
            value={nameAr || ""}
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
            value={descriptionAr || ""}
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
            value={restaurantId || ""} 
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
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <Select 
            value={categoryId || ""} 
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
          <label
            htmlFor="upload-image"
            className="block text-sm font-medium text-gray-700"
          >
            Upload Image
          </label>
          {uploadImageUrl ? (
            <div className="p-2">
              <img width={100} src={uploadImageUrl} alt="" />
            </div>
          ) : null}
          <input
            type="file"
            id="upload-image"
            onChange={(e) => {
              if (e.target.files) {
                setUploadImage(e.target.files[0]);
                setUploadImageUrl(URL.createObjectURL(e.target.files[0]));
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

export default EditItem;
