<template>
  <div class="app-container">
    <header class="app-header">
      <h1>员工管理</h1>
      <div class="store-info">当前门店: {{ storeName }}</div>
    </header>

    <main class="app-main">
      <div class="toolbar">
        <button class="btn btn-primary" @click="openAddModal">
          <span class="icon">+</span>
          新增员工
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
      showViewModal: false,
      currentEmployee: null,
      viewEmployee: null,
      submitting: false,
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
  mounted() {
    this.loadEmployees();
  },
  methods: {
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
      } catch (error) {
        console.error('加载员工列表失败:', error);
        alert('加载员工列表失败');
      } finally {
        this.loading = false;
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
            alert('员工创建成功');
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

  .form-row {
    grid-template-columns: 1fr;
  }

  .upload-row {
    flex-direction: column;
  }
}
</style>
