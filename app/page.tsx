// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function Home() {
//   const [files, setFiles] = useState<FileList | null>(null);
//   const [rotation, setRotation] = useState<number>(0);
//   const [flip, setFlip] = useState<boolean>(false);
//   const [brightness, setBrightness] = useState<number>(1);
//   const [contrast, setContrast] = useState<number>(1);
//   const [blur, setBlur] = useState<number>(0);
//   const [noise, setNoise] = useState<number>(0);
//   const [loading, setLoading] = useState<boolean>(false);

//   const handleUpload = async () => {
//     if (!files || files.length === 0) return;

//     setLoading(true);

//     const formData = new FormData();
//     Array.from(files).forEach((file) =>
//       formData.append("images", file)
//     );

//     formData.append("rotation", rotation.toString());
//     formData.append("flip", flip ? "true" : "false");
//     formData.append("brightness", brightness.toString());
//     formData.append("contrast", contrast.toString());
//     formData.append("blur", blur.toString());
//     formData.append("noise", noise.toString());

//     const res = await fetch("/api/augment", {
//       method: "POST",
//       body: formData,
//     });

//     const blob = await res.blob();
//     const url = window.URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "augmented_images.zip";
//     a.click();

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-4xl text-white"
//       >
//         <h1 className="text-4xl font-bold mb-6 text-center">
//           Dataset Augmentation Studio
//         </h1>

//         {/* Upload Section */}
//         <div className="space-y-4">

//           {/* Single / Multiple Image Upload */}
//           <div className="border-2 border-dashed border-white/40 rounded-xl p-6 text-center hover:bg-white/10 transition duration-300">
//             <input
//               type="file"
//               multiple
//               accept="image/*"
//               onChange={(e) => setFiles(e.target.files)}
//               className="hidden"
//               id="imageUpload"
//             />
//             <label htmlFor="imageUpload" className="cursor-pointer text-lg">
//               Select Image(s)
//             </label>
//           </div>

//           {/* Folder Upload */}
//           <div className="border-2 border-dashed border-white/40 rounded-xl p-6 text-center hover:bg-white/10 transition duration-300">
//             <input
//               type="file"
//               multiple
//               accept="image/*"
//               {...({ webkitdirectory: "true" } as any)}
//               onChange={(e) => setFiles(e.target.files)}
//               className="hidden"
//               id="folderUpload"
//             />
//             <label htmlFor="folderUpload" className="cursor-pointer text-lg">
//               Select Folder
//             </label>
//           </div>

//           {files && (
//             <p className="text-sm text-center text-white/80">
//               {files.length} file(s) selected
//             </p>
//           )}
//         </div>

//         {/* Controls */}
//         <div className="mt-6 space-y-5">
//           <Slider
//             label="Rotation"
//             value={rotation}
//             min={0}
//             max={360}
//             onChange={setRotation}
//           />

//           <Checkbox
//             label="Flip vertically"
//             checked={flip}
//             onChange={setFlip}
//           />

//           <Slider
//             label="Brightness"
//             value={brightness}
//             min={0.5}
//             max={2}
//             step={0.1}
//             onChange={setBrightness}
//           />

//           <Slider
//             label="Contrast"
//             value={contrast}
//             min={0.5}
//             max={2}
//             step={0.1}
//             onChange={setContrast}
//           />

//           <Slider
//             label="Blur"
//             value={blur}
//             min={0}
//             max={10}
//             onChange={setBlur}
//           />

//           <Slider
//             label="Noise"
//             value={noise}
//             min={0}
//             max={50}
//             onChange={setNoise}
//           />
//         </div>

//         {/* Button */}
//         <div className="text-center mt-6">
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleUpload}
//             className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-full shadow-lg"
//           >
//             {loading ? "Processing..." : "Generate & Download ZIP"}
//           </motion.button>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ---------- Slider ----------
// function Slider({
//   label,
//   value,
//   min,
//   max,
//   step = 1,
//   onChange,
// }: {
//   label: string;
//   value: number;
//   min: number;
//   max: number;
//   step?: number;
//   onChange: (v: number) => void;
// }) {
//   return (
//     <div>
//       <label className="flex justify-between text-sm mb-1">
//         <span>{label}</span>
//         <span>{value}</span>
//       </label>
//       <input
//         type="range"
//         min={min}
//         max={max}
//         step={step}
//         value={value}
//         onChange={(e) => onChange(Number(e.target.value))}
//         className="w-full accent-pink-400"
//       />
//     </div>
//   );
// }

// // ---------- Checkbox ----------
// function Checkbox({
//   label,
//   checked,
//   onChange,
// }: {
//   label: string;
//   checked: boolean;
//   onChange: (v: boolean) => void;
// }) {
//   return (
//     <div className="flex items-center space-x-2">
//       <input
//         type="checkbox"
//         checked={checked}
//         onChange={(e) => onChange(e.target.checked)}
//         className="accent-pink-400"
//       />
//       <span>{label}</span>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {

  const [files, setFiles] = useState<FileList | null>(null);

  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [blur, setBlur] = useState(0);
  const [noise, setNoise] = useState(0);

  const [baseName, setBaseName] = useState("dataset");
  const [startIndex, setStartIndex] = useState(1);

  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!files) return;

    setLoading(true);

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    formData.append("rotation", rotation.toString());
    formData.append("flip", flip ? "true" : "false");
    formData.append("brightness", brightness.toString());
    formData.append("contrast", contrast.toString());
    formData.append("blur", blur.toString());
    formData.append("noise", noise.toString());

    formData.append("baseName", baseName);
    formData.append("startIndex", startIndex.toString());

    const res = await fetch("/api/augment", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "augmented_images.zip";
    a.click();

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-4xl text-white"
      >

        <h1 className="text-4xl font-bold mb-6 text-center">
          Dataset Augmentation Studio
        </h1>

        {/* Upload */}
        <div className="space-y-4">

          <div className="border-2 border-dashed border-white/40 rounded-xl p-6 text-center hover:bg-white/10">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
              className="hidden"
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className="cursor-pointer text-lg">
              Select Image(s)
            </label>
          </div>

          <div className="border-2 border-dashed border-white/40 rounded-xl p-6 text-center hover:bg-white/10">
            <input
              type="file"
              multiple
              accept="image/*"
              {...({ webkitdirectory: "true" } as any)}
              onChange={(e) => setFiles(e.target.files)}
              className="hidden"
              id="folderUpload"
            />
            <label htmlFor="folderUpload" className="cursor-pointer text-lg">
              Select Folder
            </label>
          </div>

          {files && (
            <p className="text-sm text-center text-white/80">
              {files.length} file(s) selected
            </p>
          )}

        </div>

        {/* Dataset Naming */}
        <div className="mt-6 grid grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Base filename"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            className="p-2 rounded text-black"
          />

          <input
            type="number"
            placeholder="Start number"
            value={startIndex}
            onChange={(e) => setStartIndex(Number(e.target.value))}
            className="p-2 rounded text-black"
          />

        </div>

        {/* Controls */}
        <div className="mt-6 space-y-5">

          <Slider label="Rotation" value={rotation} min={0} max={360} onChange={setRotation} />

          <Checkbox label="Flip vertically" checked={flip} onChange={setFlip} />

          <Slider label="Brightness" value={brightness} min={0.5} max={2} step={0.1} onChange={setBrightness} />

          <Slider label="Contrast" value={contrast} min={0.5} max={2} step={0.1} onChange={setContrast} />

          <Slider label="Blur" value={blur} min={0} max={10} onChange={setBlur} />

          <Slider label="Noise" value={noise} min={0} max={50} onChange={setNoise} />

        </div>

        {/* Button */}
        <div className="text-center mt-6">

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-full shadow-lg"
          >
            {loading ? "Processing..." : "Generate & Download ZIP"}
          </motion.button>

        </div>

      </motion.div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: any) {
  return (
    <div>
      <label className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pink-400"
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: any) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-pink-400"
      />
      <span>{label}</span>
    </div>
  );
}