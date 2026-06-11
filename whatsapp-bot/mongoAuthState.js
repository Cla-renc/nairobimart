/* eslint-disable */
/**
 * MongoDB-based WhatsApp Auth State for Baileys
 * Stores session data in MongoDB so it survives Render restarts.
 */

const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

async function useMongoDBAuthState(prisma) {
    const writeData = async (key, data) => {
        const value = JSON.stringify(data, BufferJSON.replacer);
        await prisma.whatsAppSession.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    };

    const readData = async (key) => {
        try {
            const record = await prisma.whatsAppSession.findUnique({ where: { key } });
            if (!record) return null;
            return JSON.parse(record.value, BufferJSON.reviver);
        } catch {
            return null;
        }
    };

    const removeData = async (key) => {
        try {
            await prisma.whatsAppSession.delete({ where: { key } });
        } catch {
            // ignore if not found
        }
    };

    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                await writeData(`${category}-${id}`, value);
                            } else {
                                await removeData(`${category}-${id}`);
                            }
                        }
                    }
                },
            },
        },
        saveCreds: async () => {
            await writeData('creds', creds);
        },
    };
}

module.exports = { useMongoDBAuthState };
