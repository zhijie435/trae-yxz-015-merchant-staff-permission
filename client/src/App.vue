<template>
  <div class="login-page" v-if="!isLoggedIn">
    <div class="login-container">
      <div class="login-header">
        <h1>🏪 员工管理系统</h1>
        <p>门店端权限管理平台</p>
      </div>

      <div class="login-tabs">
        <button 
          class="login-tab" 
          :class="{ active: loginMode === 'code' }"
          @click="loginMode = 'code'"
        >
          📱 验证码登录
        </button>
        <button 
          class="login-tab" 
          :class="{ active: loginMode === 'password' }"
          @click="loginMode = 'password'"
        >
          🔐 密码登录
        </button>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label>手机号</label>
          <input 
            v-model="loginForm.phone" 
            type="tel" 
            placeholder="请输入手机号"
            maxlength="11"
            @input="loginForm.phone = loginForm.phone.replace(/\D/g, '')"
          />
        </div>

        <div class="form-group" v-if="loginMode === 'code'">
          <label>验证码</label>
          <div class="code-input-group">
            <input 
              v-model="loginForm.code" 
              type="text" 
              placeholder="请输入验证码"
              maxlength="6"
              @input="loginForm.code = loginForm.code.replace(/\D/g, '')"
            />
            <button 
              class="btn-code" 
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div class="form-group" v-if="loginMode === 'password'">
          <label>密码</label>
          <input 
            v-model="loginForm.password" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="请输入密码"
          />
          <button class="btn-show-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <button class="btn-login" @click="handleLogin" :disabled="loggingIn">
          {{ loggingIn ? '登录中...' : '登录' }}
        </button>

        <div class="login-tips">
          <p>演示账号: 13800138001 (管理员) / 13800138002 (员工)</p>
          <p>初始密码: 123456</p>
        </div>
      </div>
    </div>
  </div>

  <div class="app-container" v-else>
    <header class="app-header">
      <div class="header-left">
        <h1>🏪 员工管理系统</h1>
        <div class="user-info">
          <span class="user-name">{{ currentUser?.name }}</span>
          <span class="user-role">{{ currentUser?.role === 'manager' ? '管理员' : '员工' }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-logout" @click="logout">
          退出登录
        </button>
      </div>
    </header>

    <div class="tab-bar">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'employees' }"
        @click="switchTab('employees')"
      >
        👥 员工管理
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'tasks' }"
        @click="switchTab('tasks')"
      >
        📋 任务管理
      </button>
    </div>

    <main class="app-main">
      <div v-if="activeTab === 'employees'">
      <div class="toolbar">
        <button class="btn btn-primary" @click="openAddModal">
          <span class="icon">+</span>
          新增员工
        </button>
        <button class="btn btn-warning" @click="openApprovalModal" v-if="pendingCount > 0">
          <span class="icon">⏳</span>
          待审核 ({{ pendingCount }})
        </button>
      </div>

      <div class="employee-table">
        <table>
          <thead>
            <tr>
              <th>照片</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td>
                <img 
                  v-if="emp.avatar" 
                  :src="getFullImageUrl(emp.avatar)" 
                  class="avatar-thumbnail"
                  @error="handleImageError"
                />
                <span v-else class="no-avatar">无</span>
              </td>
              <td>{{ emp.name }}</td>
              <td>{{ emp.phone }}</td>
              <td>
                <span :class="['role-tag', emp.role]">
                  {{ emp.role === 'manager' ? '管理员' : '员工' }}
                </span>
              </td>
              <td>
                <span :class="['status-tag', emp.status]">
                  {{ emp.status === 'active' ? '启用' : '禁用' }}
                </span>
              </td>
              <td>{{ formatDate(emp.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="editEmployee(emp)" title="编辑">
                    ✎
                  </button>
                  <button class="btn-icon" @click="showPasswordModal(emp)" title="修改密码">
                    🔑
                  </button>
                  <button class="btn-icon btn-permission" @click="showPermissionModal(emp)" title="权限配置">
                    🔐
                  </button>
                  <button 
                    class="btn-icon" 
                    :class="emp.status === 'active' ? 'btn-disable' : 'btn-enable'"
                    @click="toggleStatus(emp)"
                    :title="emp.status === 'active' ? '禁用' : '启用'"
                  >
                    {{ emp.status === 'active' ? '⛔' : '✅' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="employees.length === 0" class="empty-state">
          暂无员工数据
        </div>
      </div>
    </main>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ showAddModal ? '新增员工' : '编辑员工' }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>姓名 *</label>
              <input 
                v-model="formData.name" 
                type="text" 
                placeholder="请输入员工姓名"
              />
            </div>
            <div class="form-group">
              <label>手机号 *</label>
              <input 
                v-model="formData.phone" 
                type="tel" 
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>角色 *</label>
              <select v-model="formData.role">
                <option value="staff">员工</option>
                <option value="manager">管理员</option>
              </select>
            </div>
            <div v-if="showAddModal" class="form-group">
              <label>初始密码</label>
              <input 
                v-model="formData.password" 
                type="password" 
                placeholder="请输入初始密码(默认: 123456)"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>形象照片</h3>
            <div class="upload-area" @click="triggerAvatarUpload">
              <div v-if="avatarPreview" class="preview-container">
                <img :src="avatarPreview" class="preview-image" />
                <button class="remove-btn" @click.stop="removeAvatar">×</button>
              </div>
              <div v-else class="upload-placeholder">
                <div class="upload-icon">📷</div>
                <div class="upload-text">点击上传形象照片</div>
                <div class="upload-hint">支持 JPG、PNG 格式</div>
              </div>
              <input 
                ref="avatarInput"
                type="file" 
                accept="image/jpeg,image/png,image/jpg"
                style="display: none"
                @change="handleAvatarUpload"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>身份证照片</h3>
            <div class="upload-row">
              <div class="upload-area small" @click="triggerIdCardFrontUpload">
                <div v-if="idCardFrontPreview" class="preview-container">
                  <img :src="idCardFrontPreview" class="preview-image" />
                  <button class="remove-btn" @click.stop="removeIdCardFront">×</button>
                </div>
                <div v-else class="upload-placeholder">
                  <div class="upload-icon">🪪</div>
                  <div class="upload-text">身份证正面</div>
                  <div class="upload-hint">点击上传</div>
                </div>
                <input 
                  ref="idCardFrontInput"
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg"
                  style="display: none"
                  @change="handleIdCardFrontUpload"
                />
              </div>

              <div class="upload-area small" @click="triggerIdCardBackUpload">
                <div v-if="idCardBackPreview" class="preview-container">
                  <img :src="idCardBackPreview" class="preview-image" />
                  <button class="remove-btn" @click.stop="removeIdCardBack">×</button>
                </div>
                <div v-else class="upload-placeholder">
                  <div class="upload-icon">🪪</div>
                  <div class="upload-text">身份证反面</div>
                  <div class="upload-hint">点击上传</div>
                </div>
                <input 
                  ref="idCardBackInput"
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg"
                  style="display: none"
                  @change="handleIdCardBackUpload"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submitForm" :disabled="submitting">
            {{ submitting ? '提交中...' : (showAddModal ? '创建' : '保存') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPasswordChangeModal" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal">
        <div class="modal-header">
          <h2>修改密码</h2>
          <button class="modal-close" @click="closePasswordModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>员工: {{ currentEmployee?.name }}</label>
          </div>
          <div class="form-group">
            <label>新密码 *</label>
            <input 
              v-model="newPassword" 
              type="password" 
              placeholder="请输入新密码"
            />
          </div>
          <div class="form-group">
            <label>确认密码 *</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePasswordModal">取消</button>
          <button class="btn btn-primary" @click="submitPassword">确认修改</button>
        </div>
      </div>
    </div>

    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal">
        <div class="modal-header">
          <h2>员工详情</h2>
          <button class="modal-close" @click="closeViewModal">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <div class="detail-row">
              <label>形象照片:</label>
              <img v-if="viewEmployee?.avatar" :src="getFullImageUrl(viewEmployee.avatar)" class="detail-image" />
              <span v-else>未上传</span>
            </div>
            <div class="detail-row">
              <label>身份证正面:</label>
              <img v-if="viewEmployee?.idCardFront" :src="getFullImageUrl(viewEmployee.idCardFront)" class="detail-image" />
              <span v-else>未上传</span>
            </div>
            <div class="detail-row">
              <label>身份证反面:</label>
              <img v-if="viewEmployee?.idCardBack" :src="getFullImageUrl(viewEmployee.idCardBack)" class="detail-image" />
              <span v-else>未上传</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showPermissionModal" class="modal-overlay" @click.self="closePermissionModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>权限配置 - {{ currentEmployee?.name }}</h2>
          <button class="modal-close" @click="closePermissionModal">×</button>
        </div>
        <div class="modal-body">
          <div class="permission-info">
            <div class="info-text">
              <span class="info-icon">ℹ️</span>
              <span>勾选该员工可使用的功能权限</span>
            </div>
            <div class="permission-summary">
              <span class="summary-label">已选权限:</span>
              <span class="summary-count">{{ selectedPermissions.length }} / {{ totalPermissions }}</span>
            </div>
          </div>

          <div class="permission-groups">
            <div 
              v-for="group in PERMISSION_GROUPS" 
              :key="group.key" 
              class="permission-group"
            >
              <div class="group-header">
                <div class="group-title">
                  <span class="group-icon">{{ group.icon }}</span>
                  <span class="group-name">{{ group.name }}</span>
                </div>
                <label class="group-toggle">
                  <input 
                    type="checkbox"
                    :checked="isGroupAllSelected(group.permissions)"
                    @change="toggleGroup(group.permissions)"
                  />
                  <span class="toggle-text">{{ isGroupAllSelected(group.permissions) ? '全选' : '取消' }}</span>
                </label>
              </div>
              <div class="group-permissions">
                <div 
                  v-for="perm in group.permissions" 
                  :key="perm"
                  class="permission-item"
                >
                  <label class="permission-label">
                    <input 
                      type="checkbox"
                      :value="perm"
                      v-model="selectedPermissions"
                    />
                    <div class="permission-content">
                      <div class="permission-label-text">{{ PERMISSION_DETAILS[perm].label }}</div>
                      <div class="permission-description">{{ PERMISSION_DETAILS[perm].description }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePermissionModal">取消</button>
          <button class="btn btn-primary" @click="savePermissions" :disabled="savingPermissions">
            {{ savingPermissions ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showApprovalModal" class="modal-overlay" @click.self="closeApprovalModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>待审核员工</h2>
          <button class="modal-close" @click="closeApprovalModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="pendingEmployees.length === 0" class="empty-state">
            暂无待审核员工
          </div>
          <div v-else class="approval-list">
            <div v-for="emp in pendingEmployees" :key="emp.id" class="approval-item">
              <div class="approval-info">
                <img 
                  v-if="emp.avatar" 
                  :src="getFullImageUrl(emp.avatar)" 
                  class="avatar-thumbnail"
                />
                <span v-else class="no-avatar">无</span>
                <div class="approval-details">
                  <div class="approval-name">{{ emp.name }}</div>
                  <div class="approval-meta">
                    <span class="role-tag" :class="emp.role">
                      {{ emp.role === 'manager' ? '管理员' : '员工' }}
                    </span>
                    <span>{{ emp.phone }}</span>
                  </div>
                </div>
              </div>
              <div class="approval-idcard" v-if="emp.idCardFront || emp.idCardBack">
                <div class="idcard-images">
                  <img 
                    v-if="emp.idCardFront" 
                    :src="getFullImageUrl(emp.idCardFront)" 
                    class="idcard-image"
                    title="身份证正面"
                  />
                  <img 
                    v-if="emp.idCardBack" 
                    :src="getFullImageUrl(emp.idCardBack)" 
                    class="idcard-image"
                    title="身份证反面"
                  />
                </div>
              </div>
              <div class="approval-actions">
                <button class="btn btn-success btn-sm" @click="approveEmployee(emp)">
                  ✓ 通过
                </button>
                <button class="btn btn-danger btn-sm" @click="rejectEmployee(emp)">
                  ✕ 拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-if="activeTab === 'tasks'" class="task-management">
      <div class="task-toolbar">
        <button class="btn btn-primary" @click="openAddTaskModal">
          <span class="icon">+</span>
          创建任务
        </button>
        <div class="task-filter">
          <select v-model="taskFilter" @change="filterTasks">
            <option value="all">全部任务</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div class="task-stats" v-if="taskStats">
        <div class="stat-item">
          <span class="stat-number">{{ taskStats.total }}</span>
          <span class="stat-label">总任务</span>
        </div>
        <div class="stat-item pending">
          <span class="stat-number">{{ taskStats.pending }}</span>
          <span class="stat-label">待处理</span>
        </div>
        <div class="stat-item in-progress">
          <span class="stat-number">{{ taskStats.inProgress }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-item completed">
          <span class="stat-number">{{ taskStats.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-item overdue">
          <span class="stat-number">{{ taskStats.overdue }}</span>
          <span class="stat-label">已逾期</span>
        </div>
      </div>

      <div v-if="isManager" class="info-banner">
        <span class="info-icon">ℹ️</span>
        <span>管理员视图: 可以看到所有任务并进行指派</span>
      </div>
      <div v-else class="info-banner employee">
        <span class="info-icon">👤</span>
        <span>员工视图: 仅显示被指派给您的任务</span>
      </div>

      <div class="task-list">
        <div v-if="filteredTasks.length === 0" class="empty-state">
          暂无任务
        </div>
        <div v-else class="task-cards">
          <div v-for="task in filteredTasks" :key="task.id" class="task-card">
            <div class="task-card-header">
              <div class="task-priority" :class="task.priority">
                {{ task.priority === 'high' ? '紧急' : (task.priority === 'medium' ? '普通' : '低') }}
              </div>
              <div class="task-status" :class="task.status">
                {{ task.status === 'pending' ? '待处理' : (task.status === 'in_progress' ? '进行中' : '已完成') }}
              </div>
            </div>
            <div class="task-card-body">
              <h3 class="task-title">{{ task.title }}</h3>
              <p class="task-description">{{ task.description }}</p>
              <div class="task-meta">
                <div class="meta-item">
                  <span class="meta-label">指派给:</span>
                  <span class="meta-value">{{ task.assigneeName || '未指派' }}</span>
                </div>
                <div class="meta-item" v-if="task.dueDate">
                  <span class="meta-label">截止日期:</span>
                  <span class="meta-value" :class="{ overdue: isOverdue(task) && task.status !== 'completed' }">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="task-card-footer">
              <button class="btn-icon" @click="editTask(task)" title="编辑">
                ✎
              </button>
              <button class="btn-icon btn-success" @click="updateTaskStatus(task, 'in_progress')" v-if="task.status === 'pending'" title="开始任务">
                ▶
              </button>
              <button class="btn-icon btn-primary" @click="updateTaskStatus(task, 'completed')" v-if="task.status !== 'completed'" title="完成任务">
                ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ editingTask ? '编辑任务' : '创建任务' }}</h2>
          <button class="modal-close" @click="closeTaskModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>任务标题 *</label>
            <input 
              v-model="taskForm.title" 
              type="text" 
              placeholder="请输入任务标题"
            />
          </div>
          <div class="form-group">
            <label>任务描述</label>
            <textarea 
              v-model="taskForm.description" 
              rows="4"
              placeholder="请输入任务描述"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>优先级</label>
              <select v-model="taskForm.priority">
                <option value="low">低</option>
                <option value="medium">普通</option>
                <option value="high">紧急</option>
              </select>
            </div>
            <div class="form-group">
              <label>截止日期</label>
              <input 
                v-model="taskForm.dueDate" 
                type="date"
              />
            </div>
          </div>
          <div class="form-group" v-if="isManager">
            <label>指派给</label>
            <select v-model="taskForm.assigneeId">
              <option :value="null">不指派</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.name }} ({{ emp.role === 'manager' ? '管理员' : '员工' }})
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeTaskModal">取消</button>
          <button class="btn btn-primary" @click="submitTask" :disabled="submitting">
            {{ submitting ? '提交中...' : (editingTask ? '保存' : '创建') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from './api/employee.js';
import taskApi from './api/task.js';
import authApi from './api/auth.js';
import { PERMISSION_GROUPS, PERMISSION_DETAILS } from './config/permissions.js';

export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      currentUser: null,
      activeTab: 'employees',
      PERMISSION_GROUPS,
      PERMISSION_DETAILS,
      storeId: 'store001',
      storeName: '示例门店',
      isManager: true,
      currentEmployeeId: null,
      loginMode: 'code',
      loginForm: {
        phone: '',
        code: '',
        password: ''
      },
      showPassword: false,
      countdown: 0,
      loggingIn: false,
      employees: [],
      tasks: [],
      taskStats: null,
      taskFilter: 'all',
      loading: false,
      showAddModal: false,
      showEditModal: false,
      showPasswordChangeModal: false,
      showViewModal: false,
      showPermissionModal: false,
      showApprovalModal: false,
      showTaskModal: false,
      currentEmployee: null,
      pendingEmployees: [],
      pendingCount: 0,
      viewEmployee: null,
      submitting: false,
      savingPermissions: false,
      selectedPermissions: [],
      editingTask: null,
      taskForm: {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assigneeId: null
      },
      formData: {
        name: '',
        phone: '',
        role: 'staff',
        password: '',
        avatar: '',
        idCardFront: '',
        idCardBack: ''
      },
      avatarFile: null,
      avatarPreview: '',
      idCardFrontFile: null,
      idCardFrontPreview: '',
      idCardBackFile: null,
      idCardBackPreview: '',
      newPassword: '',
      confirmPassword: ''
    };
  },
  computed: {
    totalPermissions() {
      let total = 0;
      PERMISSION_GROUPS.forEach(group => {
        total += group.permissions.length;
      });
      return total;
    },
    filteredTasks() {
      if (this.taskFilter === 'all') {
        return this.tasks;
      }
      return this.tasks.filter(task => task.status === this.taskFilter);
    }
  },
  mounted() {
    this.checkLoginStatus();
  },
  methods: {
    async checkLoginStatus() {
      const token = localStorage.getItem('employeeToken');
      const userData = localStorage.getItem('employeeUser');
      
      if (token && userData) {
        try {
          const response = await authApi.verifyToken();
          if (response.success) {
            this.currentUser = response.data.employee;
            this.isLoggedIn = true;
            this.isManager = this.currentUser.role === 'manager';
            this.currentEmployeeId = this.currentUser.id;
            this.storeId = this.currentUser.storeId;
            this.loadEmployees();
            return;
          }
        } catch (error) {
          console.error('验证登录状态失败:', error);
        }
        
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeUser');
      }
      
      this.isLoggedIn = false;
    },

    async sendCode() {
      if (!this.loginForm.phone) {
        alert('请输入手机号');
        return;
      }

      if (this.loginForm.phone.length !== 11) {
        alert('请输入正确的手机号');
        return;
      }

      try {
        const response = await authApi.sendVerificationCode(this.loginForm.phone);
        if (response.success) {
          alert('验证码发送成功');
          this.countdown = 60;
          const timer = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
              clearInterval(timer);
            }
          }, 1000);
        } else {
          alert(response.message);
        }
      } catch (error) {
        console.error('发送验证码失败:', error);
        alert('发送验证码失败，请重试');
      }
    },

    async handleLogin() {
      if (!this.loginForm.phone) {
        alert('请输入手机号');
        return;
      }

      if (this.loginForm.phone.length !== 11) {
        alert('请输入正确的手机号');
        return;
      }

      this.loggingIn = true;

      try {
        let response;
        
        if (this.loginMode === 'code') {
          if (!this.loginForm.code) {
            alert('请输入验证码');
            this.loggingIn = false;
            return;
          }
          
          response = await authApi.loginWithCode(this.loginForm.phone, this.loginForm.code);
        } else {
          if (!this.loginForm.password) {
            alert('请输入密码');
            this.loggingIn = false;
            return;
          }
          
          response = await authApi.loginWithPassword(this.loginForm.phone, this.loginForm.password);
        }

        if (response.success) {
          this.currentUser = response.data.employee;
          this.isLoggedIn = true;
          this.isManager = this.currentUser.role === 'manager';
          this.currentEmployeeId = this.currentUser.id;
          this.storeId = this.currentUser.storeId;
          
          localStorage.setItem('employeeToken', response.data.token);
          localStorage.setItem('employeeUser', JSON.stringify(this.currentUser));
          
          alert('登录成功');
          this.loginForm = { phone: '', code: '', password: '' };
          this.loadEmployees();
        } else {
          alert(response.message);
        }
      } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败，请重试');
      } finally {
        this.loggingIn = false;
      }
    },

    logout() {
      if (!confirm('确定要退出登录吗？')) {
        return;
      }
      
      this.isLoggedIn = false;
      this.currentUser = null;
      this.isManager = false;
      this.currentEmployeeId = null;
      
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeUser');
      
      this.employees = [];
      this.tasks = [];
      this.activeTab = 'employees';
      
      alert('已退出登录');
    },

    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'tasks') {
        this.loadTasks();
        this.loadTaskStats();
      }
    },

    async loadTasks() {
      this.loading = true;
      try {
        const response = await taskApi.getTasks(
          this.storeId, 
          this.isManager ? null : this.currentEmployeeId,
          this.isManager
        );
        if (response.success) {
          this.tasks = response.data;
        }
      } catch (error) {
        console.error('加载任务列表失败:', error);
        alert('加载任务列表失败');
      } finally {
        this.loading = false;
      }
    },

    async loadTaskStats() {
      try {
        const response = await taskApi.getTaskStats(
          this.storeId,
          this.isManager ? null : this.currentEmployeeId,
          this.isManager
        );
        if (response.success) {
          this.taskStats = response.data;
        }
      } catch (error) {
        console.error('加载任务统计失败:', error);
      }
    },

    openAddTaskModal() {
      this.editingTask = null;
      this.taskForm = {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assigneeId: null
      };
      this.showTaskModal = true;
    },

    editTask(task) {
      this.editingTask = task;
      this.taskForm = {
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assigneeId: task.assigneeId
      };
      this.showTaskModal = true;
    },

    closeTaskModal() {
      this.showTaskModal = false;
      this.editingTask = null;
    },

    async submitTask() {
      if (!this.taskForm.title) {
        alert('请填写任务标题');
        return;
      }

      this.submitting = true;
      try {
        const taskData = {
          title: this.taskForm.title,
          description: this.taskForm.description,
          priority: this.taskForm.priority,
          storeId: this.storeId,
          dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate).toISOString() : null,
          assigneeId: this.taskForm.assigneeId,
          creatorId: this.currentEmployeeId
        };

        let response;
        if (this.editingTask) {
          response = await taskApi.updateTask(
            this.editingTask.id, 
            taskData,
            this.isManager ? null : this.currentEmployeeId,
            this.isManager
          );
        } else {
          response = await taskApi.createTask(taskData);
        }

        if (response.success) {
          alert(this.editingTask ? '任务更新成功' : '任务创建成功');
          this.closeTaskModal();
          this.loadTasks();
          this.loadTaskStats();
        }
      } catch (error) {
        console.error('提交任务失败:', error);
        alert('操作失败，请重试');
      } finally {
        this.submitting = false;
      }
    },

    async updateTaskStatus(task, status) {
      try {
        const response = await taskApi.updateTask(
          task.id,
          { status },
          this.isManager ? null : this.currentEmployeeId,
          this.isManager
        );
        if (response.success) {
          alert('任务状态更新成功');
          this.loadTasks();
          this.loadTaskStats();
        }
      } catch (error) {
        console.error('更新任务状态失败:', error);
        alert('操作失败，请重试');
      }
    },

    filterTasks() {
      // 过滤通过computed属性实现
    },

    isOverdue(task) {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < new Date();
    },

    getFullImageUrl(path) {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      return `http://localhost:3000${path}`;
    },

    handleImageError(e) {
      e.target.src = '';
      e.target.style.display = 'none';
    },

    async loadEmployees() {
      this.loading = true;
      try {
        const response = await api.getEmployees(this.storeId);
        if (response.success) {
          this.employees = response.data;
        }
        await this.loadPendingCount();
      } catch (error) {
        console.error('加载员工列表失败:', error);
        alert('加载员工列表失败');
      } finally {
        this.loading = false;
      }
    },

    async loadPendingCount() {
      try {
        const response = await api.getPendingEmployees(this.storeId);
        if (response.success) {
          this.pendingCount = response.total;
        }
      } catch (error) {
        console.error('获取待审核数量失败:', error);
      }
    },

    async openApprovalModal() {
      try {
        const response = await api.getPendingEmployees(this.storeId);
        if (response.success) {
          this.pendingEmployees = response.data;
          this.showApprovalModal = true;
        }
      } catch (error) {
        console.error('获取待审核列表失败:', error);
        alert('获取待审核列表失败');
      }
    },

    closeApprovalModal() {
      this.showApprovalModal = false;
      this.pendingEmployees = [];
    },

    async approveEmployee(employee) {
      if (!confirm(`确定要通过员工 ${employee.name} 的审核吗?`)) {
        return;
      }

      try {
        const response = await api.approveEmployee(employee.id);
        if (response.success) {
          alert('员工审核已通过');
          this.pendingEmployees = this.pendingEmployees.filter(e => e.id !== employee.id);
          await this.loadPendingCount();
          await this.loadEmployees();
        }
      } catch (error) {
        console.error('审核通过失败:', error);
        alert('操作失败，请重试');
      }
    },

    async rejectEmployee(employee) {
      if (!confirm(`确定要拒绝员工 ${employee.name} 的审核吗?`)) {
        return;
      }

      try {
        const response = await api.rejectEmployee(employee.id);
        if (response.success) {
          alert('员工审核已拒绝');
          this.pendingEmployees = this.pendingEmployees.filter(e => e.id !== employee.id);
          await this.loadPendingCount();
        }
      } catch (error) {
        console.error('审核拒绝失败:', error);
        alert('操作失败，请重试');
      }
    },

    openAddModal() {
      this.resetFormData();
      this.showAddModal = true;
    },

    editEmployee(employee) {
      this.currentEmployee = employee;
      this.formData = {
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        password: '',
        avatar: employee.avatar || '',
        idCardFront: employee.idCardFront || '',
        idCardBack: employee.idCardBack || ''
      };
      this.avatarPreview = employee.avatar ? this.getFullImageUrl(employee.avatar) : '';
      this.idCardFrontPreview = employee.idCardFront ? this.getFullImageUrl(employee.idCardFront) : '';
      this.idCardBackPreview = employee.idCardBack ? this.getFullImageUrl(employee.idCardBack) : '';
      this.avatarFile = null;
      this.idCardFrontFile = null;
      this.idCardBackFile = null;
      this.showEditModal = true;
    },

    resetFormData() {
      this.formData = {
        name: '',
        phone: '',
        role: 'staff',
        password: '',
        avatar: '',
        idCardFront: '',
        idCardBack: ''
      };
      this.avatarFile = null;
      this.avatarPreview = '';
      this.idCardFrontFile = null;
      this.idCardFrontPreview = '';
      this.idCardBackFile = null;
      this.idCardBackPreview = '';
    },

    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },

    triggerIdCardFrontUpload() {
      this.$refs.idCardFrontInput.click();
    },

    triggerIdCardBackUpload() {
      this.$refs.idCardBackInput.click();
    },

    handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
          alert('请上传 JPG、PNG 格式的图片');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        this.avatarFile = file;
        this.avatarPreview = URL.createObjectURL(file);
      }
    },

    handleIdCardFrontUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
          alert('请上传 JPG、PNG 格式的图片');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        this.idCardFrontFile = file;
        this.idCardFrontPreview = URL.createObjectURL(file);
      }
    },

    handleIdCardBackUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
          alert('请上传 JPG、PNG 格式的图片');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过 5MB');
          return;
        }
        this.idCardBackFile = file;
        this.idCardBackPreview = URL.createObjectURL(file);
      }
    },

    removeAvatar() {
      this.avatarFile = null;
      this.avatarPreview = '';
      this.$refs.avatarInput.value = '';
    },

    removeIdCardFront() {
      this.idCardFrontFile = null;
      this.idCardFrontPreview = '';
      this.$refs.idCardFrontInput.value = '';
    },

    removeIdCardBack() {
      this.idCardBackFile = null;
      this.idCardBackPreview = '';
      this.$refs.idCardBackInput.value = '';
    },

    async submitForm() {
      if (!this.formData.name || !this.formData.phone) {
        alert('请填写必填项（姓名、手机号）');
        return;
      }

      this.submitting = true;

      try {
        let avatarUrl = this.formData.avatar;
        let idCardFrontUrl = this.formData.idCardFront;
        let idCardBackUrl = this.formData.idCardBack;

        if (this.avatarFile) {
          const uploadRes = await api.uploadAvatar(this.avatarFile);
          if (uploadRes.success) {
            avatarUrl = uploadRes.data.url;
          }
        }

        if (this.idCardFrontFile || this.idCardBackFile) {
          const idCardRes = await api.uploadIdCard(this.idCardFrontFile, this.idCardBackFile);
          if (idCardRes.success) {
            if (idCardRes.data.front) {
              idCardFrontUrl = idCardRes.data.front;
            }
            if (idCardRes.data.back) {
              idCardBackUrl = idCardRes.data.back;
            }
          }
        }

        if (this.showAddModal) {
          const response = await api.createEmployee({
            name: this.formData.name,
            phone: this.formData.phone,
            role: this.formData.role,
            password: this.formData.password,
            storeId: this.storeId,
            avatar: avatarUrl,
            idCardFront: idCardFrontUrl,
            idCardBack: idCardBackUrl
          });
          if (response.success) {
            alert('员工创建成功，请等待管理员审核通过后即可登录');
            this.closeModal();
            this.loadEmployees();
          }
        } else {
          const response = await api.updateEmployee(this.currentEmployee.id, {
            name: this.formData.name,
            phone: this.formData.phone,
            role: this.formData.role,
            avatar: avatarUrl,
            idCardFront: idCardFrontUrl,
            idCardBack: idCardBackUrl
          });
          if (response.success) {
            alert('员工信息更新成功');
            this.closeModal();
            this.loadEmployees();
          }
        }
      } catch (error) {
        console.error('提交失败:', error);
        alert('操作失败，请重试');
      } finally {
        this.submitting = false;
      }
    },

    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.resetFormData();
      this.currentEmployee = null;
    },

    showPasswordModal(employee) {
      this.currentEmployee = employee;
      this.newPassword = '';
      this.confirmPassword = '';
      this.showPasswordChangeModal = true;
    },

    async submitPassword() {
      if (!this.newPassword || !this.confirmPassword) {
        alert('请填写密码');
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }

      try {
        const response = await api.updatePassword(this.currentEmployee.id, this.newPassword);
        if (response.success) {
          alert('密码修改成功');
          this.closePasswordModal();
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        alert('修改密码失败');
      }
    },

    closePasswordModal() {
      this.showPasswordChangeModal = false;
      this.currentEmployee = null;
      this.newPassword = '';
      this.confirmPassword = '';
    },

    async toggleStatus(employee) {
      const action = employee.status === 'active' ? '禁用' : '启用';
      if (!confirm(`确定要${action}员工 ${employee.name} 的账号吗?`)) {
        return;
      }

      try {
        const response = await api.toggleEmployeeStatus(employee.id);
        if (response.success) {
          alert(response.message);
          this.loadEmployees();
        }
      } catch (error) {
        console.error('更新状态失败:', error);
        alert('操作失败');
      }
    },

    viewEmployeeDetail(employee) {
      this.viewEmployee = employee;
      this.showViewModal = true;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.viewEmployee = null;
    },

    showPermissionModal(employee) {
      this.currentEmployee = employee;
      this.selectedPermissions = [...(employee.permissions || [])];
      this.showPermissionModal = true;
    },

    closePermissionModal() {
      this.showPermissionModal = false;
      this.currentEmployee = null;
      this.selectedPermissions = [];
    },

    isGroupAllSelected(permissions) {
      return permissions.every(p => this.selectedPermissions.includes(p));
    },

    toggleGroup(permissions) {
      const allSelected = this.isGroupAllSelected(permissions);
      if (allSelected) {
        this.selectedPermissions = this.selectedPermissions.filter(p => !permissions.includes(p));
      } else {
        permissions.forEach(p => {
          if (!this.selectedPermissions.includes(p)) {
            this.selectedPermissions.push(p);
          }
        });
      }
    },

    async savePermissions() {
      this.savingPermissions = true;
      try {
        const response = await api.updatePermissions(this.currentEmployee.id, this.selectedPermissions);
        if (response.success) {
          alert('权限配置保存成功');
          this.closePermissionModal();
          this.loadEmployees();
        }
      } catch (error) {
        console.error('保存权限失败:', error);
        alert('保存失败，请重试');
      } finally {
        this.savingPermissions = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.login-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
  font-weight: 700;
}

.login-header p {
  font-size: 14px;
  opacity: 0.9;
}

.login-tabs {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
}

.login-tab {
  flex: 1;
  padding: 15px;
  border: none;
  background: white;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.login-tab:hover {
  color: #667eea;
  background: #f8f9ff;
}

.login-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.login-form {
  padding: 30px 40px;
}

.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.login-form input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.login-form input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input-group input {
  flex: 1;
}

.btn-code {
  padding: 12px 20px;
  background: #f0f0f0;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-code:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-show-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-tips {
  margin-top: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

.login-tips p {
  margin: 5px 0;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
}

.user-role {
  opacity: 0.9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-logout {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.app-header h1 {
  font-size: 28px;
  font-weight: 600;
}

.app-main {
  padding: 30px 40px;
}

.toolbar {
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.icon {
  font-size: 18px;
  font-weight: bold;
}

.employee-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

td {
  font-size: 14px;
  color: #555;
}

.avatar-thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.no-avatar {
  display: inline-block;
  width: 50px;
  height: 50px;
  line-height: 50px;
  text-align: center;
  background: #f0f0f0;
  border-radius: 50%;
  color: #999;
  font-size: 12px;
}

.role-tag, .status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-block;
}

.role-tag.manager {
  background: #e3f2fd;
  color: #1976d2;
}

.role-tag.staff {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-tag.active {
  background: #e8f5e9;
  color: #388e3c;
}

.status-tag.inactive {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
}

.btn-icon:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.btn-disable:hover {
  background: #ffebee;
  border-color: #d32f2f;
}

.btn-enable:hover {
  background: #e8f5e9;
  border-color: #388e3c;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-large {
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
}

.modal-header h2 {
  font-size: 20px;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 30px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 30px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.form-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-area.small {
  padding: 20px;
  flex: 1;
}

.upload-row {
  display: flex;
  gap: 20px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 48px;
}

.upload-area.small .upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.preview-container {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.upload-area.small .preview-image {
  max-width: 150px;
  max-height: 150px;
}

.remove-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  border: 2px solid white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.remove-btn:hover {
  background: #ff7875;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.detail-row label {
  font-weight: 500;
  color: #333;
  min-width: 100px;
}

.detail-image {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  object-fit: cover;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.permission-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.info-icon {
  font-size: 18px;
}

.permission-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-count {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.permission-groups {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.permission-group {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-icon {
  font-size: 24px;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
}

.group-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: all 0.3s;
}

.group-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.group-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.toggle-text {
  font-size: 12px;
  font-weight: 500;
}

.group-permissions {
  padding: 15px;
  background: white;
}

.permission-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item:hover {
  background: #f8f9fa;
}

.permission-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.permission-label input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #667eea;
}

.permission-content {
  flex: 1;
}

.permission-label-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 12px;
  color: #999;
}

.btn-permission:hover {
  background: #e8f5e9;
  border-color: #388e3c;
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 70vh;
  overflow-y: auto;
}

.approval-item {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.3s;
}

.approval-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.approval-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.approval-details {
  flex: 1;
}

.approval-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.approval-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.approval-idcard {
  margin-bottom: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
}

.idcard-images {
  display: flex;
  gap: 15px;
}

.idcard-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.idcard-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.approval-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.tab-bar {
  display: flex;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  padding: 0 40px;
}

.tab-btn {
  padding: 15px 30px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #667eea;
  background: #f0f0ff;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
  font-weight: 600;
}

.task-management {
  padding: 30px 40px;
}

.task-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-filter select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.task-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.stat-item.pending {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.stat-item.in-progress {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.stat-item.completed {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.stat-item.overdue {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 14px;
  opacity: 0.9;
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.info-banner.employee {
  background: #fff3e0;
  color: #f57c00;
}

.info-icon {
  font-size: 20px;
}

.task-list {
  margin-top: 20px;
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.task-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.task-priority {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.task-priority.high {
  background: #ffebee;
  color: #d32f2f;
}

.task-priority.medium {
  background: #e3f2fd;
  color: #1976d2;
}

.task-priority.low {
  background: #f3e5f5;
  color: #7b1fa2;
}

.task-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.task-status.pending {
  background: #fff3e0;
  color: #f57c00;
}

.task-status.in_progress {
  background: #e3f2fd;
  color: #1976d2;
}

.task-status.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.task-card-body {
  padding: 20px;
}

.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.task-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-label {
  color: #999;
  min-width: 80px;
}

.meta-value {
  color: #333;
  font-weight: 500;
}

.meta-value.overdue {
  color: #d32f2f;
  font-weight: 600;
}

.task-card-footer {
  display: flex;
  gap: 8px;
  padding: 15px 20px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
}

@media (max-width: 768px) {
  .login-container {
    margin: 20px;
  }

  .login-header {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .login-form {
    padding: 20px;
  }

  .app-header {
    flex-direction: column;
    gap: 10px;
    padding: 20px;
  }

  .header-left {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .user-info {
    align-items: center;
  }

  .app-main {
    padding: 20px;
  }

  table {
    font-size: 12px;
  }

  .tab-bar {
    padding: 0 20px;
  }

  .tab-btn {
    padding: 12px 20px;
    font-size: 14px;
  }

  .task-management {
    padding: 20px;
  }

  .task-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .task-cards {
    grid-template-columns: 1fr;
  }

  .task-toolbar {
    flex-direction: column;
    gap: 15px;
  }

  .approval-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .idcard-images {
    flex-direction: column;
  }

  .idcard-image {
    max-width: 100%;
  }

  .approval-actions {
    flex-direction: column;
  }

  .approval-actions button {
    width: 100%;
  }

  th, td {
    padding: 10px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .upload-row {
    flex-direction: column;
  }

  .modal-large {
    width: 95%;
    max-width: none;
  }

  .permission-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .group-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .group-toggle {
    width: 100%;
    justify-content: center;
  }
}
</style>
