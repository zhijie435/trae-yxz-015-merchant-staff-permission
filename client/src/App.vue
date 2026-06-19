<template>
  <div class="app-container">
    <header class="app-header">
      <h1>员工管理</h1>
      <div class="store-info">当前门店: {{ storeName }}</div>
    </header>

    <main class="app-main">
      <div class="toolbar">
        <button class="btn btn-primary" @click="showAddModal = true">
          <span class="icon">+</span>
          新增员工
        </button>
      </div>

      <div class="employee-table">
        <table>
          <thead>
            <tr>
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
      <div class="modal">
        <div class="modal-header">
          <h2>{{ showAddModal ? '新增员工' : '编辑员工' }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
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
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submitForm">
            {{ showAddModal ? '创建' : '保存' }}
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

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
import api from './api/employee.js';

export default {
  name: 'App',
  data() {
    return {
      storeId: 'store001',
      storeName: '示例门店',
      employees: [],
      loading: false,
      showAddModal: false,
      showEditModal: false,
      showPasswordChangeModal: false,
      currentEmployee: null,
      formData: {
        name: '',
        phone: '',
        role: 'staff',
        password: ''
      },
      newPassword: '',
      confirmPassword: ''
    };
  },
  mounted() {
    this.loadEmployees();
  },
  methods: {
    async loadEmployees() {
      this.loading = true;
      try {
        const response = await api.getEmployees(this.storeId);
        if (response.success) {
          this.employees = response.data;
        }
      } catch (error) {
        console.error('加载员工列表失败:', error);
        alert('加载员工列表失败');
      } finally {
        this.loading = false;
      }
    },

    editEmployee(employee) {
      this.currentEmployee = employee;
      this.formData = {
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        password: ''
      };
      this.showEditModal = true;
    },

    async submitForm() {
      if (!this.formData.name || !this.formData.phone) {
        alert('请填写必填项');
        return;
      }

      try {
        if (this.showAddModal) {
          const response = await api.createEmployee({
            ...this.formData,
            storeId: this.storeId
          });
          if (response.success) {
            alert('员工创建成功');
            this.closeModal();
            this.loadEmployees();
          }
        } else {
          const response = await api.updateEmployee(this.currentEmployee.id, {
            name: this.formData.name,
            phone: this.formData.phone,
            role: this.formData.role
          });
          if (response.success) {
            alert('员工信息更新成功');
            this.closeModal();
            this.loadEmployees();
          }
        }
      } catch (error) {
        console.error('提交失败:', error);
        alert('操作失败');
      }
    },

    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.formData = {
        name: '',
        phone: '',
        role: 'staff',
        password: ''
      };
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

.app-header h1 {
  font-size: 28px;
  font-weight: 600;
}

.store-info {
  font-size: 14px;
  opacity: 0.9;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 10px;
    padding: 20px;
  }

  .app-main {
    padding: 20px;
  }

  table {
    font-size: 12px;
  }

  th, td {
    padding: 10px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
