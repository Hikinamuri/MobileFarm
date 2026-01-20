import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Upload, CheckCircle2 } from "lucide-react";
import { Wall } from "../../types/wall";
import WallsAPI from "../../api/WallsAPI.ts";
import cl from "./WallList.module.scss";

interface WallListProps {
    selectedWalls: Wall[];
    setSelectedWalls: React.Dispatch<React.SetStateAction<Wall[]>>;
    allGroups?: Wall[];
}

export const WallList = ({
    selectedWalls,
    setSelectedWalls,
    allGroups,
}: WallListProps) => {
    const [wallList, setWallList] = useState<Wall[]>([]);
    // const [selectedWalls, setSelectedWalls] = useState<Wall[]>([]);
    const [isSelectedAll, setIsSelectedAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const [fileContent, setFileContent] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Фильтрация групп по поиску
    const filteredGroups = wallList.filter(
        (group) =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.screen_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectWall = (wall: Wall) => {
        const updatedSelectedWalls = selectedWalls.some((w) => w.id === wall.id)
            ? selectedWalls.filter((w) => w.id !== wall.id)
            : [...selectedWalls, wall];

        setSelectedWalls(updatedSelectedWalls);

        setWallList(
            wallList.map((w) =>
                w.id === wall.id
                    ? {
                          ...w,
                          isSelected: updatedSelectedWalls.some(
                              (sw) => sw.id === wall.id
                          ),
                      }
                    : w
            )
        );

        // setWalls(updatedSelectedWalls);
    };

    const selectAllWalls = () => {
        const shouldSelectAll = !isSelectedAll;
        const updatedWalls = wallList.map((wall) => ({
            ...wall,
            isSelected: shouldSelectAll,
        }));

        setIsSelectedAll(shouldSelectAll);
        setWallList(updatedWalls);
        setSelectedWalls(shouldSelectAll ? updatedWalls : []);
        // setWalls(shouldSelectAll ? updatedWalls : []);
    };

    const openModal = () => {
        setIsModalOpen(true);
        setFileContent([]);
        setFileName("");
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const AddGroups = async (groupList: string[]) => {
        setIsUploading(true);
        try {
            await WallsAPI.addGroup(groupList);
            const response = await WallsAPI.getGroups();

            const updatedWalls = response.map((wall: Wall) => ({
                id: wall.id,
                name: wall.name,
                screen_name: wall.screen_name,
                isSelected: selectedWalls.some((sw) => sw.id === wall.id),
            }));

            setWallList(updatedWalls);
            setSelectedWalls(updatedWalls.filter((w) => w.isSelected));
            // setWalls(updatedWalls.filter((w) => w.isSelected));

            // Закрываем модалку после успешной загрузки
            setTimeout(() => {
                setIsModalOpen(false);
                setIsUploading(false);
            }, 1000);
        } catch (error) {
            console.error("Ошибка при добавлении групп:", error);
            setIsUploading(false);
        }
    };

    const readFileContent = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                const result = reader.result as string;
                const lines = result
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);

                setFileContent(lines);
                AddGroups(lines);
            }
        };
        reader.onerror = () => {
            console.error("Ошибка при чтении файла");
            setIsUploading(false);
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            readFileContent(file);
        }
    };

    const getGroups = async () => {
        try {
            const response = await WallsAPI.getGroups();
            const wallsWithSelection = response.map((wall: Wall) => ({
                id: wall.id,
                name: wall.name,
                screen_name: wall.screen_name,
                isSelected: selectedWalls.some((sw) => sw.id === wall.id),
            }));

            setWallList(wallsWithSelection);
        } catch (error) {
            console.error("Ошибка при загрузке групп:", error);
        }
    };

    useEffect(() => {
        getGroups();
    }, []);

    // Эффект для обновления выбранных стен при изменении wallList
    useEffect(() => {
        const updatedSelected = wallList.filter((wall) => wall.isSelected);
        setSelectedWalls(updatedSelected);
        // setWalls(updatedSelected);
    }, [wallList]);

    useEffect(() => {
        if (allGroups && allGroups.length > 0) {
            // Синхронизируем список групп с актуальными данными
            const syncedWalls = selectedWalls.filter((selectedWall) =>
                allGroups.some((group) => group.id === selectedWall.id)
            );

            if (syncedWalls.length !== selectedWalls.length) {
                setSelectedWalls(syncedWalls);
            }
        }
    }, [allGroups, selectedWalls, setSelectedWalls]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cl.groupSelector}
            >
                <div className={cl.header}>
                    <div className={cl.titleSection}>
                        <Users className={cl.titleIcon} />
                        <h2 className={cl.title}>Группы</h2>
                    </div>
                    <div className={cl.badge}>
                        {selectedWalls.length} выбрано
                    </div>
                </div>

                <div className={cl.searchContainer}>
                    {/* <Search className={cl.searchIcon} /> */}
                    <input
                        type="text"
                        placeholder="Поиск групп..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cl.searchInput}
                    />
                </div>

                <button onClick={selectAllWalls} className={cl.selectAllButton}>
                    {isSelectedAll ? "Снять выделение" : "Выбрать все"}
                </button>

                {/* Ограничиваем высоту списка групп */}
                <div className={cl.groupsContainer}>
                    {filteredGroups.length === 0 ? (
                        <div className={cl.emptyState}>
                            <Users className={cl.emptyIcon} />
                            <p className={cl.emptyText}>
                                {searchQuery
                                    ? "Группы не найдены"
                                    : "Нет доступных групп"}
                            </p>
                        </div>
                    ) : (
                        <div className={cl.scrollWrapper}>
                            <div className={cl.groupsList}>
                                {filteredGroups.map((group, index) => (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => selectWall(group)}
                                        className={`${cl.groupItem} ${
                                            group.isSelected ? cl.selected : ""
                                        }`}
                                    >
                                        <div className={cl.groupContent}>
                                            <div className={cl.checkboxWrapper}>
                                                <div
                                                    className={`${
                                                        cl.checkbox
                                                    } ${
                                                        group.isSelected
                                                            ? cl.checked
                                                            : ""
                                                    }`}
                                                >
                                                    {group.isSelected && (
                                                        <CheckCircle2
                                                            className={
                                                                cl.checkIcon
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className={cl.groupInfo}>
                                                <div className={cl.groupHeader}>
                                                    <h3
                                                        className={cl.groupName}
                                                    >
                                                        {group.name}
                                                    </h3>
                                                    {group.isSelected && (
                                                        <CheckCircle2
                                                            className={
                                                                cl.selectedIcon
                                                            }
                                                        />
                                                    )}
                                                </div>

                                                <div className={cl.groupMeta}>
                                                    <span
                                                        className={
                                                            cl.screenName
                                                        }
                                                    >
                                                        @{group.screen_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openModal}
                    className={cl.addButton}
                >
                    <Plus className={cl.addIcon} />
                    Добавить группы
                </motion.button>
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cl.modalOverlay}
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={cl.modalContent}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={cl.modalHeader}>
                                <h3 className={cl.modalTitle}>
                                    Добавление групп
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className={cl.closeButton}
                                >
                                    <X className={cl.closeIcon} />
                                </button>
                            </div>

                            <div className={cl.modalBody}>
                                {!isUploading && fileContent.length === 0 && (
                                    <div className={cl.uploadSection}>
                                        <div className={cl.uploadIcon}>
                                            <Upload />
                                        </div>
                                        <p className={cl.uploadText}>
                                            Загрузите файл с ID групп (каждый ID
                                            на новой строке)
                                        </p>
                                        <label className={cl.fileUploadLabel}>
                                            <input
                                                type="file"
                                                accept=".txt,.csv"
                                                onChange={handleFileChange}
                                                className={cl.fileInput}
                                            />
                                            <span className={cl.uploadButton}>
                                                Выбрать файл
                                            </span>
                                            {fileName && (
                                                <span className={cl.fileName}>
                                                    {fileName}
                                                </span>
                                            )}
                                        </label>
                                        <p className={cl.fileHint}>
                                            Поддерживаемые форматы: .txt, .csv
                                        </p>
                                    </div>
                                )}

                                {isUploading && (
                                    <div className={cl.uploadingSection}>
                                        <div className={cl.spinner} />
                                        <p className={cl.uploadingText}>
                                            Добавление групп...
                                        </p>
                                    </div>
                                )}

                                {fileContent.length > 0 && !isUploading && (
                                    <div className={cl.previewSection}>
                                        <div className={cl.previewHeader}>
                                            <h4 className={cl.previewTitle}>
                                                Будут добавлены группы:
                                            </h4>
                                            <span className={cl.countBadge}>
                                                {fileContent.length}
                                            </span>
                                        </div>
                                        <div className={cl.previewList}>
                                            {fileContent
                                                .slice(0, 10)
                                                .map((line, index) => (
                                                    <div
                                                        key={index}
                                                        className={
                                                            cl.previewItem
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                cl.previewNumber
                                                            }
                                                        >
                                                            {index + 1}.
                                                        </span>
                                                        <span
                                                            className={
                                                                cl.previewLine
                                                            }
                                                        >
                                                            {line}
                                                        </span>
                                                    </div>
                                                ))}
                                            {fileContent.length > 10 && (
                                                <div className={cl.moreItems}>
                                                    ... и ещё{" "}
                                                    {fileContent.length - 10}{" "}
                                                    групп
                                                </div>
                                            )}
                                        </div>
                                        <div className={cl.modalActions}>
                                            <button
                                                onClick={closeModal}
                                                className={cl.cancelButton}
                                            >
                                                Закрыть
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
