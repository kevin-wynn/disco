import { useState } from "react";
import { ChevronLeft } from "./Icons/ChevronLeft";
import { ChevronRight } from "./Icons/ChevronRight";

type Image = {
  type: string;
  uri: string;
};

type ImageCarouselProps = {
  images: Image[];
  onImageSelect: (imageUrl: string) => void;
  selectedImage: string;
};

export const ImageCarousel = ({
  images,
  onImageSelect,
  selectedImage,
}: ImageCarouselProps) => {
  const currentIndex = images.findIndex((img) => img.uri === selectedImage);
  const [index, setIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  const handlePrev = () => {
    const newIndex = index === 0 ? images.length - 1 : index - 1;
    setIndex(newIndex);
    onImageSelect(images[newIndex].uri);
  };

  const handleNext = () => {
    const newIndex = index === images.length - 1 ? 0 : index + 1;
    setIndex(newIndex);
    onImageSelect(images[newIndex].uri);
  };

  if (images.length === 0) {
    return (
      <div className="flex w-1/4 mr-4 bg-gray-800 items-center justify-center aspect-square">
        <span className="text-gray-500">No image</span>
      </div>
    );
  }

  return (
    <div className="flex w-1/4 mr-4 relative group">
      <img
        src={images[index]?.uri || selectedImage}
        alt="Album cover"
        className="w-full aspect-square object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};
