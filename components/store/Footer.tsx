import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-primary text-primary-foreground">
            <div className="container px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand & Newsletter */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-accent">NairobiMart</h2>
                        <p className="text-sm text-primary-foreground/80">
                            "Shop Smart. Shop Kenya."
                        </p>
                        <div className="pt-4">
                            <h3 className="text-sm font-semibold mb-2">Subscribe to our newsletter</h3>
                            <div className="flex space-x-2">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-9"
                                />
                                <Button variant="accent" size="sm">
                                    Join
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-primary-foreground/80">
                            <li>
                                <Link href="/products" className="hover:text-accent transition-colors">
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/categories" className="hover:text-accent transition-colors">
                                    Categories
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-accent transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-accent transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-accent transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-primary-foreground/80">
                            <li>
                                <Link href="/shipping-policy" className="hover:text-accent transition-colors">
                                    Shipping Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/refund-policy" className="hover:text-accent transition-colors">
                                    Refund Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="hover:text-accent transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-accent transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Socials */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm text-primary-foreground/80">
                            <li className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-accent" />
                                <span>support@nairobimart.co.ke</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-accent" />
                                <span>+254 700 000 000</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-accent" />
                                <span>Nairobi, Kenya</span>
                            </li>
                        </ul>
                        <div className="flex space-x-4 pt-4">
                            <Link href="#" className="hover:text-accent transition-colors">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="hover:text-accent transition-colors">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="hover:text-accent transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="hover:text-accent transition-colors">
                                <Youtube className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/60">
                    <p>© {currentYear} NairobiMart. All rights reserved. Built in Kenya, For Kenya.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
