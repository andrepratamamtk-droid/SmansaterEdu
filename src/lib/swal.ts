import Swal from 'sweetalert2';

// Toast configuration for quick non-blocking alerts
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showToastSuccess = (title: string) => {
  Toast.fire({
    icon: 'success',
    title: title
  });
};

export const showToastError = (title: string) => {
  Toast.fire({
    icon: 'error',
    title: title
  });
};

// Modal Alerts for key actions
export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'OK'
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text || 'Terjadi kesalahan saat memproses data.',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

// Standard CRUD & Export notifications
export const notifySimpanSuccess = (pesan: string = 'Data berhasil disimpan!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Disimpan!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifySimpanError = (pesan: string = 'Gagal menyimpan data!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Simpan',
    text: pesan,
    confirmButtonColor: '#ef4444'
  });
};

export const notifyEditSuccess = (pesan: string = 'Data berhasil diperbarui!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Diperbarui!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifyEditError = (pesan: string = 'Gagal memperbarui data!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Perbarui',
    text: pesan,
    confirmButtonColor: '#ef4444'
  });
};

export const notifyHapusSuccess = (pesan: string = 'Data berhasil dihapus!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Dihapus!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifyHapusError = (pesan: string = 'Gagal menghapus data!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Hapus',
    text: pesan,
    confirmButtonColor: '#ef4444'
  });
};

export const notifyCetakSuccess = (pesan: string = 'Dokumen siap dicetak!') => {
  return Toast.fire({
    icon: 'success',
    title: pesan
  });
};

export const notifyCetakError = (pesan: string = 'Gagal mencetak dokumen!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Cetak',
    text: pesan,
    confirmButtonColor: '#ef4444'
  });
};

export const notifyUnduhSuccess = (pesan: string = 'File berhasil diunduh!') => {
  return Toast.fire({
    icon: 'success',
    title: pesan
  });
};

export const notifyUnduhError = (pesan: string = 'Gagal mengunduh file!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Unduh',
    text: pesan,
    confirmButtonColor: '#ef4444'
  });
};

// Confirmation dialog for delete actions
export const confirmDeleteAlert = async (title: string = 'Apakah Anda yakin?', text: string = 'Data yang dihapus tidak dapat dikembalikan!') => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });
  return result.isConfirmed;
};

export default Swal;
