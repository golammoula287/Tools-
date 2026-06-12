
// import sharp from "sharp";
// import JSZip from "jszip";
// import { NextResponse } from "next/server";

// export const runtime = "nodejs";

// // ---------- Noise Helper ----------
// async function addNoise(
//   buffer: Buffer,
//   intensity: number
// ): Promise<Buffer> {
//   const { data, info } = await sharp(buffer)
//     .raw()
//     .toBuffer({ resolveWithObject: true });

//   const noisy = Buffer.from(data);

//   for (let i = 0; i < noisy.length; i++) {
//     const random = Math.floor(Math.random() * intensity);
//     noisy[i] = Math.min(255, noisy[i] + random);
//   }

//   return sharp(noisy, { raw: info }).png().toBuffer();
// }

// // ---------- POST ----------
// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();

//     const rawFiles = formData.getAll("images");
//     const files = rawFiles as File[];

//     if (!files || files.length === 0) {
//       return NextResponse.json(
//         { error: "No images uploaded" },
//         { status: 400 }
//       );
//     }

//     // Parameters
//     const rotation = parseInt(
//       (formData.get("rotation") as string) || "0"
//     );
//     const flip = (formData.get("flip") as string) === "true";
//     const brightness = parseFloat(
//       (formData.get("brightness") as string) || "1"
//     );
//     const contrast = parseFloat(
//       (formData.get("contrast") as string) || "1"
//     );
//     const blur = parseInt(
//       (formData.get("blur") as string) || "0"
//     );
//     const noise = parseInt(
//       (formData.get("noise") as string) || "0"
//     );

//     const zip = new JSZip();

//     for (const file of files) {
//       const arrayBuffer = await file.arrayBuffer();
//       let buffer = Buffer.from(arrayBuffer);

//       let image = sharp(buffer).rotate(rotation);

//       if (flip) {
//         image = image.flip();
//       }

//       image = image.modulate({ brightness }).linear(contrast, 0);

//       if (blur > 0) {
//         image = image.blur(blur);
//       }

//       buffer = await image.png().toBuffer();

//       if (noise > 0) {
//         buffer = await addNoise(buffer, noise);
//       }

//       const baseName =
//         file.name?.replace(/\.[^/.]+$/, "") || "untitled";

//       const finalName = `${baseName}_augmented.png`;

//       zip.file(finalName, buffer);
//     }

//     const zipBuffer = await zip.generateAsync({
//       type: "nodebuffer",
//     });

//     return new NextResponse(zipBuffer, {
//       headers: {
//         "Content-Type": "application/zip",
//         "Content-Disposition":
//           "attachment; filename=augmented_images.zip",
//       },
//     });
//   } catch (error) {
//     console.error("Augmentation Error:", error);

//     return NextResponse.json(
//       { error: "Server Error" },
//       { status: 500 }
//     );
//   }
// }

import sharp from "sharp";
import JSZip from "jszip";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Add Noise Function
async function addNoise(buffer: Buffer, intensity: number) {
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const noisy = Buffer.from(data);

  for (let i = 0; i < noisy.length; i++) {
    const rand = Math.floor(Math.random() * intensity);
    noisy[i] = Math.min(255, noisy[i] + rand);
  }

  const output = await sharp(noisy, { raw: info }).png().toBuffer();

  return Buffer.from(output);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const rawFiles = formData.getAll("images");
    const files: File[] = rawFiles.filter(
      (file): file is File => file instanceof File
    );

    const rotation = parseInt((formData.get("rotation") as string) || "0");
    const flip = (formData.get("flip") as string) === "true";
    const brightness = parseFloat((formData.get("brightness") as string) || "1");
    const contrast = parseFloat((formData.get("contrast") as string) || "1");
    const blur = parseFloat((formData.get("blur") as string) || "0");
    const noise = parseInt((formData.get("noise") as string) || "0");

    const zip = new JSZip();

    for (const file of files) {
      let buffer = Buffer.from(await file.arrayBuffer());

      let image = sharp(buffer);

      // Rotation
      if (rotation !== 0) {
        image = image.rotate(rotation);
      }

      // Flip
      if (flip) {
        image = image.flip();
      }

      // Brightness
      image = image.modulate({ brightness });

      // Contrast
      image = image.linear(contrast, 0);

      // Blur
      if (blur > 0) {
        image = image.blur(blur);
      }

      buffer = Buffer.from(await image.png().toBuffer());

      // Noise
      if (noise > 0) {
        buffer = await addNoise(buffer, noise);
      }

      const fileName =
        file.name.replace(/\.[^/.]+$/, "") + "_augmented.png";

      zip.file(fileName, buffer);
    }

    const zipBuffer = Buffer.from(
      await zip.generateAsync({ type: "nodebuffer" })
    );

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=augmented_images.zip",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Image augmentation failed" },
      { status: 500 }
    );
  }
}