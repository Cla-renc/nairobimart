"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitReview } from "@/app/actions/reviews";

export default function WriteReviewButton({ productId, productName }: { productId: string, productName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!body.trim()) {
            toast({
                title: "Error",
                description: "Review body is required.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitReview({
                productId,
                rating,
                title,
                body,
                videoUrl: videoUrl || undefined,
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: "Your review has been submitted for approval.",
                });
                setIsOpen(false);
                // reset form
                setRating(5);
                setTitle("");
                setBody("");
                setVideoUrl("");
            } else {
                toast({
                    title: "Error",
                    description: res.error || "Failed to submit review.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/95 text-white font-black px-10 h-14 w-full rounded-full uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                    Write a Review
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                        Share your experience with {productName || "this product"}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`h-6 w-6 transition-colors ${
                                            star <= rating
                                                ? "fill-accent text-accent"
                                                : "fill-muted text-muted"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="title">Title (Optional)</Label>
                        <Input
                            id="title"
                            placeholder="Brief summary of your review"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Review <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="body"
                            placeholder="What did you like or dislike?"
                            rows={4}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                        <Input
                            id="videoUrl"
                            placeholder="Link to YouTube/TikTok review"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
