import axiosInstance from "@/axiosInstance";
import Spinner from "@/components/Spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

type themeType = {
  primary: string | null;
  secondary: string | null;
  bg: string | null;
};
function EditTheme() {
  const location = useLocation();
  const record = location.state || {};
  const navigate = useNavigate();
  const { themeId } = useParams();
  // NOTE: Theme model has no `name` column — that lives on Restaurant.
  // Sending a `name` field crashes Prisma. We drop it from the payload.
  const [primary, setPrimary] = useState<string | null>(record.primary ?? null);
  const [secondary, setSecondary] = useState<string | null>(record.secondary ?? null);
  const [bg, setBg] = useState<string | null>(record.bg ?? null);
  const mutation = useMutation({
    mutationFn: (newEdit: themeType) => {
      return axiosInstance.put(`/theme/${themeId}`, newEdit);
    },
    onSuccess: () => navigate("/theme"),
  });
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ primary, secondary, bg });
  };

  const { isLoading } = useQuery({
    queryKey: ["addRating"],
  });
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Edit Theme</h2>

      <form onSubmit={handleSubmit}>
        {/* Primary Color */}
        <div className="mb-4">
          <label
            htmlFor="primary"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Primary Color
          </label>
          <div className="flex items-center gap-2 rounded-md border w-fit p-2 justify-center">
            <input
              type="color"
              id="primary"
              value={primary || ""}
              onChange={(e) => setPrimary(e.target.value)}
              className={` block  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter primary color"
            />
            <input
              type="text"
              id="primary"
              value={primary || ""}
              onChange={(e) => setPrimary(e.target.value)}
              className={` block border-none  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter primary color"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div className="mb-4">
          <label
            htmlFor="secondary"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Secondary Color
          </label>
          <div className="flex items-center gap-2 rounded-md border w-fit p-2 justify-center">
            <input
              type="color"
              id="secondary"
              value={secondary || ""}
              onChange={(e) => setSecondary(e.target.value)}
              className={` block  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter secondary color"
            />
            <input
              type="text"
              id="secondary"
              value={secondary || ""}
              onChange={(e) => setSecondary(e.target.value)}
              className={` block border-none  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter secondary color"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="mb-4">
          <label
            htmlFor="bg"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Background Color
          </label>
          <div className="flex items-center gap-2 rounded-md border w-fit p-2 justify-center">
            <input
              type="color"
              id="bg"
              value={bg || ""}
              onChange={(e) => setBg(e.target.value)}
              className={` block border-none  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter background color"
            />
            <input
              type="text"
              id="bg"
              value={bg || ""}
              onChange={(e) => setBg(e.target.value)}
              className={` block border-none  h-10 bg-transparent rounded-md sm:text-sm`}
              placeholder="Enter background color"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white disabled:animate-pulse disabled:bg-indigo-300 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditTheme;
