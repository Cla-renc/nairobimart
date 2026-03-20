import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: string, folder: string = "products") => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: `nairobimart/${folder}`,
            resource_type: "auto",
        });
        return { success: true, url: result.secure_url, publicId: result.public_id };
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return { success: false, error };
    }
};

export const deleteImage = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return { success: true };
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return { success: false, error };
    }
};

export default cloudinary;
