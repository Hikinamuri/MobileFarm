import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, MessageCircle, Send, UserPlus } from "lucide-react";
import { Users } from "../../types/users";
import AuthAPI from "../../api/AuthAPI";
import cl from "./UserList.module.scss";

export const UserList = () => {
    const [userList, setUserList] = useState<Users[]>([]);
    const navigate = useNavigate();

    const getUsers = async () => {
        const response = await AuthAPI.getUsers();
        setUserList(response);
    };

    useEffect(() => {
        getUsers();
    }, []);

    // Статистика
    const totalPosts = userList.reduce(
        (sum, user) => sum + (user.postCount || 0),
        0
    );
    const totalUsers = userList.length;
    // const avgPostsPerUser =
    //     totalUsers > 0 ? Math.round(totalPosts / totalUsers) : 0;

    // Функция для генерации цвета на основе ID пользователя
    const getUserColor = (id: number) => {
        const userIdColor = parseInt(id.toString()?.[0] || "0");
        const colors = [
            "bg-blue-500",
            "bg-purple-500",
            "bg-green-500",
            "bg-pink-500",
            "bg-orange-500",
            "bg-cyan-500",
            "bg-indigo-500",
            "bg-rose-500",
            "bg-teal-500",
            "bg-amber-500",
            "bg-violet-500",
            "bg-emerald-500",
        ];
        return colors[userIdColor % colors.length];
    };

    // Функция для получения инициалов
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    };

    // Массив статистики
    const stats = [
        {
            label: "Всего постов",
            value: totalPosts.toLocaleString(),
            icon: Send,
            color: cl.textPrimary,
        },
        {
            label: "Активных",
            value: totalUsers,
            icon: TrendingUp,
            color: cl.textAccent,
        },
        {
            label: "Аккаунты",
            value: totalUsers,
            icon: MessageCircle,
            color: cl.textPrimary,
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={cl.userStatsContainer}
        >
            <h2 className={cl.sectionTitle}>Статистика команды</h2>

            <div className={cl.statsGrid}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className={cl.statCard}
                    >
                        <div className={cl.statHeader}>
                            <stat.icon
                                className={`${cl.statIcon} ${stat.color}`}
                            />
                            <span className={cl.statLabel}>{stat.label}</span>
                        </div>
                        <p className={cl.statValue}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className={cl.usersHeader}>
                <h3 className={cl.usersTitle}>Активные аккаунты</h3>
                <span className={cl.postsLabel}>Посты</span>
            </div>

            <div className={cl.usersScrollArea}>
                <div className={cl.usersList}>
                    {userList.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            className={cl.userCard}
                        >
                            <div className={cl.userInfo}>
                                <div
                                    className={`${cl.userAvatar} ${getUserColor(
                                        user.id
                                    )}`}
                                >
                                    {getInitials(
                                        user.first_name,
                                        user.last_name
                                    )}
                                </div>

                                <div className={cl.userDetails}>
                                    <div className={cl.userHeader}>
                                        <h4 className={cl.userName}>
                                            {user.last_name} {user.first_name}
                                        </h4>
                                        {/* <span className={cl.userPosts}>
                                            {user.postCount || 0}
                                        </span> */}
                                    </div>

                                    <div className={cl.userMeta}>
                                        <div className={cl.userEngagement}>
                                            {/* <div
                                                className={cl.progressContainer}
                                            >
                                                <div
                                                    className={cl.progressBar}
                                                    style={{
                                                        width: `${Math.min(
                                                            (user.postCount ||
                                                                0) * 2,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div> */}
                                            {/* <div className={cl.engagementInfo}>
                                                <span
                                                    className={
                                                        cl.engagementLabel
                                                    }
                                                >
                                                    Активность
                                                </span>
                                                <span
                                                    className={
                                                        cl.engagementValue
                                                    }
                                                >
                                                    {Math.min(
                                                        (user.postCount || 0) *
                                                            2,
                                                        100
                                                    )}
                                                    %
                                                </span>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/auth")}
                className={cl.addAccountButton}
            >
                <UserPlus className={cl.buttonIcon} />
                Добавить аккаунт
            </motion.button>
        </motion.div>
    );
};
