import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Box,
  FileText,
  Home,
  MessageSquare,
  StickyNote,
  Video,
} from "lucide-react";
import HomeImage from "@/public/product/home.png";
import ChatImage from "@/public/product/chat.png";
import RoomsImage from "@/public/product/rooms.png";
import DocsImage from "@/public/product/docs.png";
import BoardsImage from "@/public/product/boards.png";
import StorageImage from "@/public/product/storage.png";

export function ProductCarousal() {
  const items = [
    {
      title: "Home",
      url: "#",
      icon: Home,
      image: HomeImage,
    },
    {
      title: "Chats",
      url: "#",
      icon: MessageSquare,
      image: ChatImage,
    },
    {
      title: "Rooms",
      url: "#",
      icon: Video,
      image: RoomsImage,
    },
    {
      title: "Docs",
      url: "#",
      icon: FileText,
      image: DocsImage,
    },
    {
      title: "Boards",
      url: "#",
      icon: StickyNote,
      image: BoardsImage,
    },
    {
      title: "Storage",
      url: "#",
      icon: Box,
      image: StorageImage,
    },
  ];

  return (
    <Carousel className="overflow-hidden">
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={index} className="flex justify-center">
            <Image
              src={item.image}
              alt={item.title}
              width={1280}
              height={800}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
