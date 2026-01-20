import axios from "axios";
import { Wall } from "../types/wall";

const baseUrl = import.meta.env.VITE_BASE_URL;

export interface Collection {
    id: number;
    name: string;
    groups: Wall[];
}

class WallsAPI {
    public static sendWallPost = async (
        messages: string[],
        walls: Wall[],
        images?: File[]
    ) => {
        const token = localStorage.getItem("access_token");

        const formData = new FormData();
        const wallsQuery = walls.map((w) => `group_ids=-${w.id}`).join("&-");
        const queryParams = `${wallsQuery}`;

        messages.forEach((message) => {
            formData.append("messages", message);
        });

        if (images && images.length > 0) {
            images.forEach((image) => {
                formData.append("images", image);
            });
        }

        try {
            const response = await axios.post(
                `${baseUrl}/vk/wall.post?${queryParams}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response && response.status === 200) {
                return response;
            }
        } catch (err) {
            console.log(err);
        }
    };

    public static addGroup = async (walls: string[]) => {
        const token = localStorage.getItem("access_token");

        const wallsIds = walls.map((w) => {
            return w.split("https://vk.com/")[1];
        });

        const queryParams = wallsIds.map((id) => `group_ids=${id}`).join("&");

        try {
            const response = await axios.post(
                `${baseUrl}/vk/add_groups?${queryParams}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response && response.status == 200) {
                return response.data;
            }
        } catch (err) {
            console.log(err);
        }
    };

    public static getGroups = async () => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.get(`${baseUrl}/vk/get_groups`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response && response.status == 200) {
                return response.data;
            }
        } catch (err) {
            console.log(err);
        }
    };

    public static createCollection = async (name: string) => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.post(
                `${baseUrl}/vk/create_collection?name=${encodeURIComponent(
                    name
                )}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response && response.status === 200) {
                return response.data;
            }
        } catch (err) {
            console.error("Ошибка создания коллекции:", err);
            throw err;
        }
    };

    public static getCollections = async () => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.get(`${baseUrl}/vk/collections`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response && response.status === 200) {
                return response.data as Collection[];
            }
        } catch (err) {
            console.error("Ошибка получения коллекций:", err);
            throw err;
        }
    };

    public static addGroupsToCollection = async (
        collectionId: number,
        groupIds: number[]
    ) => {
        const token = localStorage.getItem("access_token");

        // Формируем query-параметры: collection_id=1&group_ids=1&group_ids=2
        const queryParams = [
            `collection_id=${collectionId}`,
            ...groupIds.map((id) => `group_ids=${id}`),
        ].join("&");

        try {
            const response = await axios.post(
                `${baseUrl}/vk/add_group_to_collection?${queryParams}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response && response.status === 200) {
                return response.data;
            }
        } catch (err) {
            console.error("Ошибка добавления групп в коллекцию:", err);
            throw err;
        }
    };

    public static deleteCollection = async (collectionId: number) => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.delete(
                `${baseUrl}/vk/delete_collection?collection_id=${collectionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response && response.status === 200) {
                return response.data;
            }
        } catch (err) {
            console.error("Ошибка удаления коллекции:", err);
            throw err;
        }
    };
}

export default WallsAPI;
