import prisma from "@/lib/prisma";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
    const settings = await prisma.siteSettings.findMany();

    return (
        <SettingsClient initialSettings={settings.map(s => ({
            id: s.id,
            key: s.key,
            value: s.value
        }))} />
    );
}
