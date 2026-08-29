/**
 * Arshith Fresh Admin - Bulk Selection & Management Helper
 */

// Toast Notifications System
const AdminToast = {
  container: null,
  init() {
    if (!this.container) {
      let existing = document.querySelector('.admin-toast-container');
      if (!existing) {
        existing = document.createElement('div');
        existing.className = 'admin-toast-container';
        document.body.appendChild(existing);
      }
      this.container = existing;
    }
  },
  show(message, type = 'success', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'toast-error' : (type === 'info' ? 'toast-info' : '')}`;
    
    let icon = '<i class="fa-solid fa-circle-check" style="color:#10b981;"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i>';
    if (type === 'info') icon = '<i class="fa-solid fa-circle-info" style="color:#3b82f6;"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// CSV Exporter Helper
const AdminExport = {
  downloadCSV(filename, headers, rows) {
    if (!rows || rows.length === 0) {
      AdminToast.show('No items selected for export', 'error');
      return;
    }

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += headers.map(escapeCsv).join(',') + '\r\n';

    rows.forEach(row => {
      csvContent += row.map(escapeCsv).join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    AdminToast.show(`Successfully exported ${rows.length} item(s) to CSV!`, 'success');
  }
};

// Dropdown Toggler Helper
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.bulk-dropdown-toggle');
  if (trigger) {
    const parent = trigger.closest('.bulk-dropdown');
    if (parent) {
      const wasOpen = parent.classList.contains('open');
      document.querySelectorAll('.bulk-dropdown.open').forEach(d => d.classList.remove('open'));
      if (!wasOpen) parent.classList.add('open');
    }
  } else if (!e.target.closest('.bulk-dropdown-menu')) {
    document.querySelectorAll('.bulk-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});
