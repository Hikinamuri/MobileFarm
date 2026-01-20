import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FolderPlus,
    FolderOpen,
    Users,
    Plus,
    Trash2,
    Save,
    ChevronDown,
    ChevronUp,
    Search,
    X,
} from "lucide-react";
import WallsAPI, { Collection } from "../../api/WallsAPI";
import { Wall } from "../../types/wall";
import cl from "./CollectionManager.module.scss";

interface CollectionManagerProps {
    onCollectionSelect: (groups: Wall[]) => void;
}

export const CollectionManager = ({
    onCollectionSelect,
}: CollectionManagerProps) => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [allGroups, setAllGroups] = useState<Wall[]>([]);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null);
    const [expandedCollectionId, setExpandedCollectionId] = useState<
        number | null
    >(null);
    const [selectedGroupsForAdd, setSelectedGroupsForAdd] = useState<number[]>(
        []
    );
    const [isLoading, setIsLoading] = useState(true);
    const [searchGroupsQuery, setSearchGroupsQuery] = useState("");

    // Загрузка данных
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [collectionsData, groupsData] = await Promise.all([
                WallsAPI.getCollections(),
                WallsAPI.getGroups(),
            ]);
            setCollections(collectionsData || []);
            setAllGroups(groupsData || []);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Создание коллекции
    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) {
            alert("Введите название коллекции");
            return;
        }

        try {
            await WallsAPI.createCollection(newCollectionName);
            setNewCollectionName("");
            await loadData();
        } catch (error) {
            console.error("Ошибка создания коллекции:", error);
        }
    };

    // Удаление коллекции
    const handleDeleteCollection = async (collectionId: number) => {
        if (!confirm("Удалить коллекцию?")) return;

        try {
            await WallsAPI.deleteCollection(collectionId);
            if (selectedCollection?.id === collectionId) {
                setSelectedCollection(null);
                setSelectedGroupsForAdd([]);
                setExpandedCollectionId(null);
            }
            await loadData();
        } catch (error) {
            console.error("Ошибка удаления коллекции:", error);
        }
    };

    // Добавление групп в коллекцию
    const handleAddGroupsToCollection = async () => {
        console.log("Добавление групп:", {
            selectedCollection,
            selectedGroupsForAdd,
            selectedCollectionId: selectedCollection?.id,
        });

        if (!selectedCollection) {
            alert("Не выбрана коллекция");
            return;
        }

        if (selectedGroupsForAdd.length === 0) {
            alert("Выберите группы для добавления");
            return;
        }

        try {
            await WallsAPI.addGroupsToCollection(
                selectedCollection.id,
                selectedGroupsForAdd
            );
            setSelectedGroupsForAdd([]);
            await loadData();
        } catch (error) {
            console.error("Ошибка добавления групп в коллекцию:", error);
        }
    };

    // Выбор группы для добавления в коллекцию
    const toggleGroupForAdd = (groupId: number) => {
        setSelectedGroupsForAdd((prev) =>
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId]
        );
    };

    // Использовать коллекцию для отправки
    const useCollectionForPost = (collection: Collection) => {
        // Вместо setWalls вызываем callback из MainPage
        onCollectionSelect(collection.groups);
        alert(
            `Выбрано ${collection.groups.length} групп из коллекции "${collection.name}"`
        );
    };

    // Переключение раскрытия коллекции
    const toggleCollectionExpand = (collection: Collection) => {
        if (expandedCollectionId === collection.id) {
            // Закрываем коллекцию
            setExpandedCollectionId(null);
            setSelectedCollection(null);
            setSelectedGroupsForAdd([]);
        } else {
            // Открываем новую коллекцию
            setExpandedCollectionId(collection.id);
            setSelectedCollection(collection);
            setSelectedGroupsForAdd([]);
        }
    };

    // Группы, которые ещё не добавлены в выбранную коллекцию
    const availableGroups = selectedCollection
        ? allGroups.filter(
              (group) =>
                  !selectedCollection.groups.some((g) => g.id === group.id)
          )
        : [];

    // Фильтруем группы по поисковому запросу
    const filteredAvailableGroups = availableGroups.filter(
        (group) =>
            group.name
                .toLowerCase()
                .includes(searchGroupsQuery.toLowerCase()) ||
            group.screen_name
                .toLowerCase()
                .includes(searchGroupsQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className={cl.loadingContainer}>
                <div className={cl.spinner}></div>
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div className={cl.collectionManager}>
            {/* Создание новой коллекции */}
            <div className={cl.createSection}>
                <h3 className={cl.sectionTitle}>
                    <FolderPlus className={cl.sectionIcon} />
                    Создать коллекцию
                </h3>
                <div className={cl.createForm}>
                    <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Название коллекции..."
                        className={cl.nameInput}
                    />
                    <button
                        onClick={handleCreateCollection}
                        className={cl.createButton}
                        disabled={!newCollectionName.trim()}
                    >
                        <Plus className={cl.buttonIcon} />
                        Создать
                    </button>
                </div>
            </div>

            {/* Список коллекций */}
            <div className={cl.collectionsSection}>
                <h3 className={cl.sectionTitle}>
                    <FolderOpen className={cl.sectionIcon} />
                    Мои коллекции ({collections.length})
                </h3>

                {collections.length === 0 ? (
                    <div className={cl.emptyState}>
                        <p>Коллекций пока нет</p>
                    </div>
                ) : (
                    <div className={cl.collectionsList}>
                        {collections.map((collection) => {
                            const isExpanded =
                                expandedCollectionId === collection.id;

                            return (
                                <motion.div
                                    key={collection.id}
                                    className={cl.collectionCard}
                                    layout
                                >
                                    <div className={cl.collectionHeader}>
                                        <div
                                            className={cl.collectionInfo}
                                            onClick={() =>
                                                toggleCollectionExpand(
                                                    collection
                                                )
                                            }
                                        >
                                            <div className={cl.expandIcon}>
                                                {isExpanded ? (
                                                    <ChevronUp />
                                                ) : (
                                                    <ChevronDown />
                                                )}
                                            </div>
                                            <span className={cl.collectionName}>
                                                {collection.name}
                                            </span>
                                            <span className={cl.groupsCount}>
                                                {collection.groups.length} групп
                                            </span>
                                        </div>

                                        <div className={cl.collectionActions}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // eslint-disable-next-line react-hooks/rules-of-hooks
                                                    useCollectionForPost(
                                                        collection
                                                    );
                                                }}
                                                className={cl.useButton}
                                                title="Использовать для поста"
                                            >
                                                <Users
                                                    className={cl.actionIcon}
                                                />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCollection(
                                                        collection.id
                                                    );
                                                }}
                                                className={cl.deleteButton}
                                                title="Удалить коллекцию"
                                            >
                                                <Trash2
                                                    className={cl.actionIcon}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={cl.collectionDetails}
                                            >
                                                {/* Группы в коллекции */}
                                                <div
                                                    className={
                                                        cl.groupsInCollection
                                                    }
                                                >
                                                    <h4>Группы в коллекции:</h4>
                                                    {collection.groups
                                                        .length === 0 ? (
                                                        <p
                                                            className={
                                                                cl.noGroups
                                                            }
                                                        >
                                                            Группы не добавлены
                                                        </p>
                                                    ) : (
                                                        <div
                                                            className={
                                                                cl.groupsList
                                                            }
                                                        >
                                                            {collection.groups.map(
                                                                (group) => (
                                                                    <div
                                                                        key={
                                                                            group.id
                                                                        }
                                                                        className={
                                                                            cl.groupItem
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                cl.groupName
                                                                            }
                                                                        >
                                                                            {
                                                                                group.name
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={
                                                                                cl.groupScreenName
                                                                            }
                                                                        >
                                                                            @
                                                                            {
                                                                                group.screen_name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Добавление групп в коллекцию */}
                                                <div
                                                    className={
                                                        cl.addGroupsSection
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            cl.addGroupsHeader
                                                        }
                                                    >
                                                        <h4>
                                                            Добавить группы в
                                                            коллекцию
                                                        </h4>
                                                        <div
                                                            className={
                                                                cl.groupsCounter
                                                            }
                                                        >
                                                            Доступно:{" "}
                                                            {
                                                                availableGroups.length
                                                            }{" "}
                                                            групп
                                                        </div>
                                                    </div>

                                                    {availableGroups.length >
                                                    0 ? (
                                                        <>
                                                            {/* Поиск по группам */}
                                                            <div
                                                                className={
                                                                    cl.searchContainer
                                                                }
                                                            >
                                                                <Search
                                                                    className={
                                                                        cl.searchIcon
                                                                    }
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Поиск групп по названию..."
                                                                    value={
                                                                        searchGroupsQuery
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setSearchGroupsQuery(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className={
                                                                        cl.searchInput
                                                                    }
                                                                />
                                                                {searchGroupsQuery && (
                                                                    <button
                                                                        onClick={() =>
                                                                            setSearchGroupsQuery(
                                                                                ""
                                                                            )
                                                                        }
                                                                        className={
                                                                            cl.clearSearch
                                                                        }
                                                                        title="Очистить поиск"
                                                                    >
                                                                        <X
                                                                            className={
                                                                                cl.clearIcon
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Кнопка выбора всех */}
                                                            {filteredAvailableGroups.length >
                                                                0 && (
                                                                <div
                                                                    className={
                                                                        cl.selectAllSection
                                                                    }
                                                                >
                                                                    <label
                                                                        className={
                                                                            cl.selectAllCheckbox
                                                                        }
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                selectedGroupsForAdd.length ===
                                                                                filteredAvailableGroups.length
                                                                            }
                                                                            onChange={() => {
                                                                                if (
                                                                                    selectedGroupsForAdd.length ===
                                                                                    filteredAvailableGroups.length
                                                                                ) {
                                                                                    setSelectedGroupsForAdd(
                                                                                        []
                                                                                    );
                                                                                } else {
                                                                                    setSelectedGroupsForAdd(
                                                                                        filteredAvailableGroups.map(
                                                                                            (
                                                                                                g
                                                                                            ) =>
                                                                                                g.id
                                                                                        )
                                                                                    );
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span
                                                                            className={
                                                                                cl.selectAllLabel
                                                                            }
                                                                        >
                                                                            {selectedGroupsForAdd.length ===
                                                                            filteredAvailableGroups.length
                                                                                ? "Снять выделение"
                                                                                : "Выбрать все"}
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            )}

                                                            {/* Список всех доступных групп с прокруткой */}
                                                            <div
                                                                className={
                                                                    cl.allGroupsContainer
                                                                }
                                                            >
                                                                {filteredAvailableGroups.length ===
                                                                0 ? (
                                                                    <div
                                                                        className={
                                                                            cl.noResults
                                                                        }
                                                                    >
                                                                        {searchGroupsQuery
                                                                            ? "Группы не найдены"
                                                                            : "Нет доступных групп для добавления"}
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div
                                                                            className={
                                                                                cl.allGroupsList
                                                                            }
                                                                        >
                                                                            {filteredAvailableGroups.map(
                                                                                (
                                                                                    group
                                                                                ) => (
                                                                                    <label
                                                                                        key={
                                                                                            group.id
                                                                                        }
                                                                                        className={
                                                                                            cl.groupCheckbox
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            className={
                                                                                                cl.checkboxWrapper
                                                                                            }
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedGroupsForAdd.includes(
                                                                                                    group.id
                                                                                                )}
                                                                                                onChange={() =>
                                                                                                    toggleGroupForAdd(
                                                                                                        group.id
                                                                                                    )
                                                                                                }
                                                                                                className={
                                                                                                    cl.groupCheckboxInput
                                                                                                }
                                                                                            />
                                                                                            <span
                                                                                                className={
                                                                                                    cl.customCheckbox
                                                                                                }
                                                                                            ></span>
                                                                                        </div>
                                                                                        <div
                                                                                            className={
                                                                                                cl.groupInfoCompact
                                                                                            }
                                                                                        >
                                                                                            <span
                                                                                                className={
                                                                                                    cl.groupName
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    group.name
                                                                                                }
                                                                                            </span>
                                                                                            <span
                                                                                                className={
                                                                                                    cl.groupScreenName
                                                                                                }
                                                                                            >
                                                                                                @
                                                                                                {
                                                                                                    group.screen_name
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </label>
                                                                                )
                                                                            )}
                                                                        </div>

                                                                        <div
                                                                            className={
                                                                                cl.groupsStats
                                                                            }
                                                                        >
                                                                            <span>
                                                                                Найдено:{" "}
                                                                                {
                                                                                    filteredAvailableGroups.length
                                                                                }{" "}
                                                                                групп
                                                                            </span>
                                                                            <span>
                                                                                Выбрано:{" "}
                                                                                {
                                                                                    selectedGroupsForAdd.length
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Кнопка добавления */}
                                                            <button
                                                                onClick={
                                                                    handleAddGroupsToCollection
                                                                }
                                                                className={
                                                                    cl.addButton
                                                                }
                                                                disabled={
                                                                    selectedGroupsForAdd.length ===
                                                                    0
                                                                }
                                                            >
                                                                <Save
                                                                    className={
                                                                        cl.buttonIcon
                                                                    }
                                                                />
                                                                Добавить
                                                                выбранные группы
                                                                (
                                                                {
                                                                    selectedGroupsForAdd.length
                                                                }
                                                                )
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div
                                                            className={
                                                                cl.noResults
                                                            }
                                                        >
                                                            Все доступные группы
                                                            уже добавлены в эту
                                                            коллекцию
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
