import cl from "./MainPage.module.scss";
import { useState, useEffect } from "react";
import WallsAPI from "../../api/WallsAPI";
import { Header } from "../../components/Header/Header";
import { WallList } from "../../components/WallList/WallList";
import { CollectionManager } from "../../components/CollectionManager/CollectionManager";
import { UserList } from "../../components/UserList/UserList";
import { Wall } from "../../types/wall";
import { motion } from "framer-motion";
import {
    FolderTree,
    Users as UsersIcon,
    Loader2,
    AlertCircle,
} from "lucide-react";
import {
    VkPostSocket,
    WallPostCommand,
    ServerEvent,
    ImageObject,
} from "../../api/WebSocket";

// interface ProgressItem {
//     groupId: string;
//     link: string;
//     status: 'pending' | 'success' | 'error';
//     error?: string;
// }

export const MainPage = () => {
    const [text, setText] = useState("");
    const [selectedWalls, setSelectedWalls] = useState<Wall[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [leftPanelMode, setLeftPanelMode] = useState<
        "groups" | "collections"
    >("groups");
    const [allGroups, setAllGroups] = useState<Wall[]>([]);
    const [ws, setWs] = useState<VkPostSocket | null>(null);
    const [results, setResults] = useState<string[]>([]);
    const [progress, setProgress] = useState<{
        total: number;
        current: number;
        successful: number;
        failed: number;
        isActive: boolean;
    }>({
        total: 0,
        current: 0,
        successful: 0,
        failed: 0,
        isActive: false,
    });
    const [recentErrors, setRecentErrors] = useState<string[]>([]);

    const handleCollectionSelect = (groups: Wall[]) => {
        setSelectedWalls(groups);
        localStorage.setItem(
            "selectedGroupsFromCollection",
            JSON.stringify(groups.map((g) => g.id)),
        );
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            setImages(filesArray);
        }
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

    const sendMessage = async () => {
        if (!text.trim()) {
            alert("Вы забыли ввести сообщение");
            return;
        }

        if (!ws) {
            alert("Нет соединения с сервером");
            return;
        }

        try {
            const imagesArray: ImageObject[] = await Promise.all(
                images.map(async (file) => {
                    const base64 = await fileToBase64(file);
                    const base64Data = base64.split(",")[1];

                    let contentType = file.type;
                    // Приводим к нужному формату, если необходимо
                    if (contentType === "image/jpeg") {
                        contentType = "image/jpg";
                    }

                    return {
                        filename: file.name,
                        content_type: contentType,
                        base64: base64Data, // чистый base64 без префикса
                    };
                }),
            );

            const groupIds = selectedWalls.map((w) => w.id * -1);

            const initialProgress = {
                total: groupIds.length,
                current: 0,
                last_update: Date.now(),
            };
            localStorage.setItem(
                "vk_wall_post_progress",
                JSON.stringify(initialProgress),
            );

            setProgress({
                total: groupIds.length,
                current: 0,
                successful: 0,
                failed: 0,
                isActive: true,
            });
            setRecentErrors([]);

            const payload: WallPostCommand = {
                command: "wall.post",
                group_ids: groupIds,
                message: text,
                images: imagesArray,
            };

            ws.send(payload);
        } catch (e) {
            console.error("Ошибка кодирования изображений", e);
        }
    };

    useEffect(() => {
        const socket = new VkPostSocket();

        const savedProgressRaw = localStorage.getItem("vk_wall_post_progress");
        if (savedProgressRaw) {
            try {
                const saved = JSON.parse(savedProgressRaw);
                if (saved.operation_id && saved.total !== undefined) {
                    setProgress((prev) => ({
                        ...prev,
                        total: saved.total,
                        current: saved.current,
                        isActive: saved.current < saved.total,
                    }));
                }
            } catch {
                console.log("Failed to parse saved progress");
            }
        }

        const savedResults = localStorage.getItem("vk_wall_post_results");
        if (savedResults) {
            try {
                const links = JSON.parse(savedResults);
                if (Array.isArray(links)) {
                    setResults(links);
                }
            } catch {
                console.log("Failed to parse saved results");
            }
        }

        socket.connect((data: ServerEvent) => {
            console.log("WS event:", data);

            if ("progress" in data && data.operation_id) {
                const progressData = {
                    operation_id: data.operation_id,
                    total: data.progress.total,
                    current: data.progress.current,
                    last_update: Date.now(),
                };
                localStorage.setItem(
                    "vk_wall_post_progress",
                    JSON.stringify(progressData),
                );
            }

            if (data.command === "status") {
                setProgress((prev) => ({
                    ...prev,
                    current: data.progress.current,
                    total: data.progress?.total || prev.total,
                    successful: prev.successful + 1,
                }));
                setResults((prev) => {
                    const newLink = data.link;
                    if (prev.includes(newLink)) {
                        console.warn("Duplicate link prevented:", newLink);
                        return prev;
                    }
                    const newResults = [...prev, newLink];
                    localStorage.setItem(
                        "vk_wall_post_results",
                        JSON.stringify(newResults),
                    );
                    return newResults;
                });

                if (data.progress.current >= data.progress.total) {
                    localStorage.removeItem("vk_wall_post_progress");
                }
            }

            if (data.command === "error") {
                // Преобразуем group_id в строку для сравнения
                const groupIdStr = data.group_id.toString();

                setProgress((prev) => ({
                    ...prev,
                    current: data.progress.current,
                    total: data.progress?.total || prev.total,
                    failed: prev.failed + 1,
                }));

                // Добавляем ошибку в список последних ошибок
                setRecentErrors((prev) => {
                    const errorMessage = `Группа ${groupIdStr}: ${data.error}`;
                    const newErrors = [errorMessage, ...prev].slice(0, 5); // Храним только последние 5 ошибок
                    return newErrors;
                });

                if (data.progress.current >= data.progress.total) {
                    localStorage.removeItem("vk_wall_post_progress");
                }
            }
        });

        setWs(socket);

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (
            progress.current > 0 &&
            progress.current >= progress.total &&
            progress.isActive
        ) {
            if (results.length > 0) {
                const blob = new Blob([results.join("\n")], {
                    type: "text/plain",
                });
                const link = URL.createObjectURL(blob);
                setDownloadLink(link);
            }

            setProgress((prev) => ({
                ...prev,
                isActive: false,
            }));
            // setResults([]);
            // localStorage.removeItem("vk_wall_post_results");
        }
    }, [progress.total, progress.isActive, progress, recentErrors, results]);

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

    const progressPercentage =
        progress.total > 0
            ? Math.round((progress.current / progress.total) * 100)
            : 0;

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
                                            400,
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

                                {/* Упрощенный прогресс-бар */}
                                {progress && (
                                    <div className={cl.progressSection}>
                                        <div className={cl.progressHeader}>
                                            <h4 className={cl.progressTitle}>
                                                Отправка постов
                                            </h4>
                                            <div className={cl.progressStats}>
                                                <span
                                                    className={
                                                        cl.progressCounter
                                                    }
                                                >
                                                    {progress.current}/
                                                    {progress.total}
                                                </span>
                                                <div
                                                    className={
                                                        cl.progressPercentage
                                                    }
                                                >
                                                    {progressPercentage}%
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={cl.progressBarContainer}
                                        >
                                            <div
                                                className={cl.progressBar}
                                                style={{
                                                    width: `${progressPercentage}%`,
                                                }}
                                            />
                                        </div>

                                        <div className={cl.progressInfo}>
                                            <div
                                                className={cl.progressStatsRow}
                                            >
                                                <span
                                                    className={`${cl.progressStat} ${cl.successStat}`}
                                                >
                                                    ✅ Успешно:{" "}
                                                    {progress.successful}
                                                </span>
                                                <span
                                                    className={`${cl.progressStat} ${cl.errorStat}`}
                                                >
                                                    ❌ Ошибки: {progress.failed}
                                                </span>
                                            </div>

                                            {recentErrors.length > 0 && (
                                                <div
                                                    className={cl.recentErrors}
                                                >
                                                    <div
                                                        className={
                                                            cl.recentErrorsTitle
                                                        }
                                                    >
                                                        <AlertCircle
                                                            size={16}
                                                        />
                                                        <span>
                                                            Последние ошибки:
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={
                                                            cl.recentErrorsList
                                                        }
                                                    >
                                                        {recentErrors.map(
                                                            (error, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={
                                                                        cl.errorItem
                                                                    }
                                                                >
                                                                    {error}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={cl.actionButtons}>
                                    <button
                                        onClick={sendMessage}
                                        className={cl.primaryButton}
                                        disabled={
                                            !text.trim() ||
                                            selectedWalls.length === 0 ||
                                            progress.isActive
                                        }
                                    >
                                        {progress.isActive ? (
                                            <>
                                                <Loader2
                                                    className={cl.spinner}
                                                />
                                                Отправка...
                                            </>
                                        ) : (
                                            `📢 Отправить в ${selectedWalls.length} групп`
                                        )}
                                    </button>
                                    {downloadLink && !progress.isActive && (
                                        <a
                                            href={downloadLink}
                                            download="result.txt"
                                            className={cl.downloadLink}
                                            onClick={() => {
                                                setTimeout(() => {
                                                    localStorage.removeItem(
                                                        "vk_wall_post_results",
                                                    );
                                                    setResults([]);
                                                    setDownloadLink(null);
                                                }, 500);
                                            }}
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
