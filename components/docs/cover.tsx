import Image from "next/image";
import React, { useRef } from "react";
import { Button } from "../ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface CoverProps {
  url?: string;
  setCoverUrl: (url: string) => void;
  docId: string;
}

const supabase = createClient(); // Create a Supabase client

const Cover: React.FC<CoverProps> = ({ docId, url, setCoverUrl }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle the file input click to open the file selection box
  const handleChangeCover = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle the file change after selecting an image
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = `cover/${Date.now()}-${file.name}`;

      try {
        // Upload the image to Supabase storage (docs bucket)
        const { data, error } = await supabase.storage
          .from("docs")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false, // Prevent overwriting existing files
          });

        if (error) {
          toast.error("Error uploading cover: " + error.message);
          return;
        }

        // Get the public URL of the uploaded image
        const {
          data: { publicUrl },
        } = supabase.storage.from("docs").getPublicUrl(fileName);

        // Update the cover URL in the database
        const { error: updateError } = await supabase
          .from("docs")
          .update({ cover: publicUrl })
          .eq("id", docId);

        if (updateError) {
          toast.error("Error updating cover URL: " + updateError.message);
          return;
        }

        // Update the state with the new cover URL
        setCoverUrl(publicUrl);
        toast.success("Cover updated successfully!");
      } catch (err) {
        toast.error("Unexpected error occurred during file upload");
      }
    }
  };

  // Handle removing the cover (set it to empty)
  const handleRemoveCover = async () => {
    if (url) {
      const fileName = url.split("/").pop();
      if (fileName) {
        try {
          // Remove cover image from Supabase storage
          const { error } = await supabase.storage
            .from("docs")
            .remove([`cover/${fileName}`]);
          if (error) {
            toast.error("Error removing cover: " + error.message);
            return;
          }

          // Update the document cover URL to be empty
          const { error: updateError } = await supabase
            .from("docs")
            .update({ cover: "" })
            .eq("id", docId);

          if (updateError) {
            toast.error(
              "Error removing cover from database: " + updateError.message
            );
            return;
          }

          setCoverUrl("");
          toast.success("Cover removed successfully!");
        } catch (err) {
          toast.error("Unexpected error occurred during cover removal");
        }
      }
    }
  };

  return (
    <div>
      {!!url && (
        <div className="group relative w-full h-[35vh] bg-neutral-300">
          <Image
            src={url}
            alt="cover"
            className="object-cover"
            fill
            sizes="100vw"
          />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-[20%] h-[20%] absolute bottom-0 right-3 group flex gap-3 justify-center items-center">
            <Button onClick={handleChangeCover} size="sm" variant="secondary">
              Change
            </Button>
            <Button onClick={handleRemoveCover} size="sm" variant="destructive">
              Remove
            </Button>
          </div>
        </div>
      )}
      {/* Hidden file input to allow the user to select a new image */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default Cover;
