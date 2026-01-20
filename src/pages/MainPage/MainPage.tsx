import cl from "./MainPage.module.scss";
import { useState, useEffect } from "react"; // Добавим useEffect
import WallsAPI from "../../api/WallsAPI";
import { Header } from "../../components/Header/Header";
import { WallList } from "../../components/WallList/WallList";
import { CollectionManager } from "../../components/CollectionManager/CollectionManager";
import { UserList } from "../../components/UserList/UserList";
import { Wall } from "../../types/wall";
import { motion } from "framer-motion";
import { FolderTree, Users as UsersIcon } from "lucide-react";

export const MainPage = () => {
    const [text, setText] = useState("");
    const [selectedWalls, setSelectedWalls] = useState<Wall[]>([]); // Переименуем для ясности
    const [images, setImages] = useState<File[]>([]);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [leftPanelMode, setLeftPanelMode] = useState<
        "groups" | "collections"
    >("groups");
    const [allGroups, setAllGroups] = useState<Wall[]>([]); // Добавим состояние для всех групп

    // Загружаем все группы при монтировании
    useEffect(() => {
        const loadAllGroups = async () => {
            try {
                const groupsData = await WallsAPI.getGroups();
                setAllGroups(groupsData || []);
            } catch (error) {
                console.error("Ошибка загрузки групп:", error);
            }
        };
        loadAllGroups();
    }, []);

    // Функция для обновления выбранных групп из коллекции
    const handleCollectionSelect = (groups: Wall[]) => {
        setSelectedWalls(groups);

        // Также обновим состояние в localStorage или другом месте для синхронизации с WallList
        localStorage.setItem(
            "selectedGroupsFromCollection",
            JSON.stringify(groups.map((g) => g.id))
        );
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            setImages(filesArray);
        }
    };

    const sendMessage = async () => {
        if (text && text.trim()) {
            const messages = text.split("\n\n\n\n");

            try {
                const response = await WallsAPI.sendWallPost(
                    messages,
                    selectedWalls, // Используем selectedWalls
                    images
                );

                if (response && response.status === 200) {
                    const result = Object.entries(
                        response.data.message
                    ).flatMap(([groupId, posts]) => {
                        return (
                            posts as {
                                post_id?: number;
                                error?: { error_msg: string };
                            }[]
                        ).map((post) => {
                            if (post.post_id) {
                                return `https://vk.com/wall${groupId}_${post.post_id}`;
                            } else if (post.error) {
                                return `https://vk.com/club${groupId}. Ошибка - ${post.error.error_msg}`;
                            }
                            return `https://vk.com/club${groupId}. Неизвестная ошибка`;
                        });
                    });

                    const resultText = result.join("\n");
                    const blob = new Blob([resultText], { type: "text/plain" });
                    const link = URL.createObjectURL(blob);
                    setDownloadLink(link);
                }
            } catch (error) {
                console.error("Ошибка отправки сообщения:", error);
            }
        } else {
            alert("Вы забыли ввести сообщение");
        }
    };

    return (
        <div className={cl.dashboard}>
            <div className={cl.container}>
                <Header />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={cl.gridContainer}
                >
                    <div className={cl.sidebar}>
                        <div className={cl.sidebarSection}>
                            <div className={cl.panelHeader}>
                                <h3 className={cl.sectionTitle}>
                                    {leftPanelMode === "groups"
                                        ? "Выбор групп"
                                        : "Коллекции"}
                                </h3>

                                <div className={cl.modeSwitcher}>
                                    <button
                                        onClick={() =>
                                            setLeftPanelMode("groups")
                                        }
                                        className={`${cl.modeButton} ${
                                            leftPanelMode === "groups"
                                                ? cl.active
                                                : ""
                                        }`}
                                        title="Выбор отдельных групп"
                                    >
                                        <UsersIcon className={cl.modeIcon} />
                                        <span>Группы</span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setLeftPanelMode("collections")
                                        }
                                        className={`${cl.modeButton} ${
                                            leftPanelMode === "collections"
                                                ? cl.active
                                                : ""
                                        }`}
                                        title="Управление коллекциями"
                                    >
                                        <FolderTree className={cl.modeIcon} />
                                        <span>Коллекции</span>
                                    </button>
                                </div>
                            </div>

                            {leftPanelMode === "groups" ? (
                                <WallList
                                    selectedWalls={selectedWalls}
                                    setSelectedWalls={setSelectedWalls}
                                    allGroups={allGroups}
                                />
                            ) : (
                                <CollectionManager
                                    onCollectionSelect={handleCollectionSelect}
                                />
                            )}
                        </div>
                    </div>

                    <div className={cl.mainContent}>
                        <div className={cl.card}>
                            <h3 className={cl.cardTitle}>Создание поста</h3>
                            <div className={cl.postComposer}>
                                <textarea
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        const target = e.target;
                                        target.style.height = "auto";
                                        target.style.height = `${Math.min(
                                            target.scrollHeight,
                                            400
                                        )}px`;
                                    }}
                                    placeholder="Введите текст поста..."
                                    className={cl.textarea}
                                />
                                <div className={cl.uploadSection}>
                                    <label className={cl.uploadLabel}>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleImageChange}
                                            className={cl.fileInput}
                                            accept=".jpg, .png, .jpeg"
                                        />
                                        <span className={cl.uploadButton}>
                                            Добавить изображения
                                        </span>
                                        <span className={cl.uploadHint}>
                                            Выбрано файлов: {images.length}
                                        </span>
                                    </label>
                                </div>
                                <div className={cl.actionButtons}>
                                    <button
                                        onClick={sendMessage}
                                        className={cl.primaryButton}
                                        disabled={
                                            !text.trim() ||
                                            selectedWalls.length === 0
                                        }
                                    >
                                        📢 Отправить в {selectedWalls.length}{" "} групп
                                    </button>
                                    {downloadLink && (
                                        <a
                                            href={downloadLink}
                                            download="result.txt"
                                            className={cl.downloadLink}
                                        >
                                            <button
                                                className={cl.secondaryButton}
                                            >
                                                Скачать результат
                                            </button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cl.sidebar}>
                        <div className={cl.sidebarSection}>
                            <h3 className={cl.sectionTitle}>Статистика</h3>
                            <UserList />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
