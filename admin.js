// admin.js
import { auth, database, ref, get, update, onValue } from './firebase.js';
import { getAllUsers, searchUsers, addPointsToUser, checkAdminStatus } from './firebase.js';
import { authManager } from './auth.js';

class AdminManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // التحقق من صلاحية المشرف
        const hasAccess = await authManager.checkAdminAccess();
        if (!hasAccess) return;

        this.currentUser = auth.currentUser;
        this.setupEventListeners();
        this.loadAllUsers();
    }

    async loadAllUsers() {
        try {
            const users = await getAllUsers();
            this.displayUsers(users);
        } catch (error) {
            console.error("Error loading users:", error);
            this.showError("فشل في تحميل المستخدمين");
        }
    }

    async searchUsers() {
        const searchTerm = document.getElementById('admin-search').value;
        const rankFilter = document.getElementById('admin-rank-filter').value;
        
        try {
            const results = await searchUsers(searchTerm, rankFilter);
            this.displayUsers(results);
        } catch (error) {
            console.error("Error searching users:", error);
            this.showError("فشل في البحث عن المستخدمين");
        }
    }

    displayUsers(users) {
        const usersTable = document.getElementById('admin-users-table');
        if (!usersTable) return;

        usersTable.innerHTML = '';

        if (!users || Object.keys(users).length === 0) {
            usersTable.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد نتائج</td></tr>';
            return;
        }

        for (const userId in users) {
            const user = users[userId];
            const row = usersTable.insertRow();
            
            const rankTitles = [
                "مبتدئ", "عضو", "عضو متميز", "عضو نشيط", "عضو فعال",
                "عضو برونزي", "عضو فضي", "عضو ذهبي", "عضو بلاتيني", "عضو ماسي", "قائد"
            ];
            
            const userRank = user.rank || 0;
            const rankTitle = rankTitles[userRank] || "غير محدد";

            row.innerHTML = `
                <td>${user.name || "غير معروف"}</td>
                <td>${user.email || "غير معروف"}</td>
                <td><span class="user-badge level-${userRank}">${rankTitle}</span></td>
                <td>${user.points || 0}</td>
                <td>${user.isAdmin ? 'نعم' : 'لا'}</td>
                <td>${new Date(user.joinDate).toLocaleDateString('ar-SA')}</td>
                <td>
                    <input type="number" id="points-${userId}" min="0" value="0" class="points-input">
                </td>
                <td>
                    <button class="action-btn add-points-btn" data-userid="${userId}">
                        <i class="fas fa-plus"></i> إضافة نقاط
                    </button>
                    <button class="action-btn view-details-btn" data-userid="${userId}">
                        <i class="fas fa-eye"></i> تفاصيل
                    </button>
                </td>
            `;
        }

        // إضافة مستمعين للأزرار
        this.setupUserActionsListeners();
    }

    setupUserActionsListeners() {
        // أزرار إضافة النقاط
        document.querySelectorAll('.add-points-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('.add-points-btn').dataset.userid;
                this.addPointsToUser(userId);
            });
        });

        // أزرار عرض التفاصيل
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('.view-details-btn').dataset.userid;
                this.viewUserDetails(userId);
            });
        });
    }

    async addPointsToUser(userId) {
        const pointsInput = document.getElementById(`points-${userId}`);
        const pointsToAdd = parseInt(pointsInput.value);
        
        if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
            this.showError("يرجى إدخال عدد صحيح موجب من النقاط");
            return;
        }

        try {
            await addPointsToUser(userId, pointsToAdd, this.currentUser.uid);
            this.showSuccess(`تم إضافة ${pointsToAdd} نقطة للمستخدم بنجاح`);
            
            // تحديث القائمة
            this.loadAllUsers();
        } catch (error) {
            console.error("Error adding points:", error);
            this.showError(error.message || "فشل في إضافة النقاط");
        }
    }

    async viewUserDetails(userId) {
        // هنا يمكنك تنفيذ عرض تفاصيل المستخدم
        alert(`عرض تفاصيل المستخدم: ${userId}`);
    }

    setupEventListeners() {
        // زر البحث
        const searchBtn = document.getElementById('admin-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchUsers();
            });
        }

        // البحث أثناء الكتابة
        const searchInput = document.getElementById('admin-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                this.searchUsers();
            });
        }

        // تصفية حسب الرتبة
        const rankFilter = document.getElementById('admin-rank-filter');
        if (rankFilter) {
            rankFilter.addEventListener('change', () => {
                this.searchUsers();
            });
        }

        // تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.handleLogout();
            });
        }
    }

    showError(message) {
        const alertDiv = document.getElementById('admin-alert');
        if (alertDiv) {
            alertDiv.textContent = message;
            alertDiv.className = 'alert alert-error';
            alertDiv.style.display = 'block';
            
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 3000);
        }
    }

    showSuccess(message) {
        const alertDiv = document.getElementById('admin-alert');
        if (alertDiv) {
            alertDiv.textContent = message;
            alertDiv.className = 'alert alert-success';
            alertDiv.style.display = 'block';
            
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// تهيئة لوحة المشرفين عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new AdminManager();
});
