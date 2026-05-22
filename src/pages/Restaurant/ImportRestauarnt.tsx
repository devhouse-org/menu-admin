import React, { useState } from "react";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";

type Props = {};

interface DataItem {
  accessCode: string;
  createdAt: string;
  deleted: boolean;
  description: string;
  id: string;
  image: string | null;
  name: string;
  updatedAt: string;
  primary?: string; // Add optional fields for theme creation
  secondary?: string;
  bg?: string;
}

const flattenObject = (
  obj: Record<string, any>,
  parent = "",
  res: Record<string, any> = {}
): Record<string, any> => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Determine the full key path
      let propName = parent ? `${parent}.${key}` : key;

      // Remove "theme." prefix from keys that belong to the theme object
      if (parent === "theme") {
        propName = key;
      }

      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
  }
  return res;
};

interface HeadsType {
  accessCode: string;
  name: string;
  description: string;
  image: string;
  primary: string;
  secondary: string;
  bg: string;
}

// Extract headers from the data
const extractHeaders = (data: DataItem[]): string[] => {
  const flattenedData = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(flattenedData.flatMap(Object.keys)));
  return headers;
};

const ImportRestaurant = (props: Props) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isHeaderMatch, setIsHeaderMatch] = useState(false);

  // Define expected headers explicitly
  const expectedHeaders = [
    "id",
    "accessCode",
    "name",
    "description",
    "image",
    "createdAt",
    "updatedAt",
    "deleted",
    "secondary",
    "primary",
    "bg",
    "restaurantId",
    "theme",
  ];

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    a.sort();
    b.sort();
    return a.every((val, index) => val === b[index]);
  };

  // Handle file change and parse CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          let data = result.data;

          // Convert `deleted` field to boolean.
          // CSV cells come back as strings, so compare against the literal
          // string "true" (case-insensitive). The previous `=== false`
          // check was always false (string !== boolean) and silently
          // marked every imported row as restored.
          data = data.map((item: any) => ({
            ...item,
            deleted: String(item.deleted).toLowerCase() === 'true',
          }));

          const csvHeads = result.meta.fields || [];
          console.log("heads: ", headers, expectedHeaders);

          setCsvHeaders(csvHeads);
          setParsedData(data);

          // Compare CSV headers with expected headers using sorted arrays
          const headersMatch = arraysEqual(expectedHeaders, csvHeads);
          setIsHeaderMatch(headersMatch);
        },
        error: (error) => {
          console.error("Error parsing CSV file:", error);
        },
      });
    }
  };

  // Handle the upload of parsed data
  const handleUpload = async () => {
    if (parsedData.length > 0 && isHeaderMatch) {
      try {
        const response = await axiosInstance.post(
          "/restaurant/import",
          parsedData
        );
        console.log("Data uploaded successfully:", response.data);
        // Handle success (e.g., show a success message)
      } catch (error) {
        console.error("Error uploading data:", error);
        // Handle error (e.g., show an error message)
      }
    } else {
      console.log("Headers do not match. Upload aborted.");
    }
  };

  return (
    <div className="relative overflow-x-auto sm:rounded-lg w-full mx-6 md:mx-0 scrollbar-hide">
      <div className="flex flex-wrap justify-between mb-4">
        <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center gap-4 pb-4">
          <label
            htmlFor="file"
            className="text-white cursor-pointer bg-gray-800 hover:bg-gray-900 font-medium rounded-lg py-2.5 px-5"
          >
            <span className="flex gap-1 ">Import</span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {csvHeaders.length > 0 && (
            <button
              onClick={handleUpload}
              className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg py-2.5 px-5"
            >
              Upload Data
            </button>
          )}

          {/* {isHeaderMatch &&
            <span className="text-red-500">CSV headers do not match the expected headers.</span>
          } */}
        </div>
      </div>
    </div>
  );
};

export default ImportRestaurant;
