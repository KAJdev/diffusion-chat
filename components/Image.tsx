import React from "react";
import { Artifact, Message } from "./Message";

export function Image({
  image,
  selectedImage,
  setSelectedImage,
  message,
  i,
}: {
  image: Artifact;
  selectedImage: number;
  setSelectedImage(i: number): void;
  message: Message;
  i: number;
}) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={i}
      src={image.image}
      alt="Generated image"
      className={`rounded mt-2 duration-300 cursor-pointer ${
        loaded ? "opacity-100 hover:opacity-75" : "opacity-0"
      } ${
        selectedImage > -1 &&
        selectedImage !== i &&
        message.images?.length !== 1
          ? "-mx-1"
          : ""
      }`}
      style={{
        maxHeight:
          selectedImage === i || message.images?.length === 1
            ? "25rem"
            : "10rem",
        maxWidth:
          selectedImage === i || message.images?.length === 1
            ? "25rem"
            : "10rem",
        height:
          selectedImage > -1 &&
          selectedImage !== i &&
          message.images?.length !== 1
            ? "0"
            : `${message.settings?.height}px`,
        width:
          selectedImage > -1 &&
          selectedImage !== i &&
          message.images?.length !== 1
            ? "0"
            : `${message.settings?.width}px`,
      }}
      onClick={() => {
        if (message.images?.length === 1) return;

        if (selectedImage === i) {
          setSelectedImage(-1);
        } else {
          setSelectedImage(i);

          if (
            window.innerHeight + document.documentElement.scrollTop ===
            document.documentElement.offsetHeight
          ) {
            setTimeout(() => {
              window.scrollTo({
                behavior: "smooth",
                top: document.body.scrollHeight,
              });
            }, 300);
          }
        }
      }}
      onLoad={() => {
        window.scrollTo({
          behavior: "smooth",
          top: document.body.scrollHeight,
        });
        setLoaded(true);
      }}
    />
  );
}
