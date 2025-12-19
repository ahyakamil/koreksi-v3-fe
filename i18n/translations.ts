type TranslationKeys = {
  comments: string
  user: string
  load_more: string
  showing: string
  showing_range: string
  name: string
  email: string
  password: string
  login: string
  register: string
  logout: string
  posts: string
  friends: string
  notifications: string
  no_notifications: string
  incoming_requests: string
  request_sent: string
  from: string
  loading: string
  unknown: string
  public_posts: string
  page_of: string
  prev: string
  next: string
  title: string
  content_placeholder: string
  image_placeholder: string
  write_comment: string
  send: string
  post: string
  post_button: string
  posting_as: string
  find_friend: string
  search_by_name: string
  friend_user_id_placeholder: string
  send_friend_request: string
  friend_request: string
  accept: string
  decline: string
  remove: string
  no_requests: string
  no_friends: string
  blocked_users: string
  no_blocked_users: string
  unblock: string
  no_more: string
  login_failed: string
  load_comments: string
}

type Translations = {
  id: TranslationKeys
  en: TranslationKeys
}

const translations: Translations = {
  id: {
    comments: 'Komentar',
    user: 'Pengguna',
    load_more: 'Muat lagi',
    showing: 'Menampilkan',
    showing_range: 'Menampilkan {count} dari {total}',
    name: 'Nama',
    email: 'Email',
    password: 'Kata sandi',
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    posts: 'Postingan',
    friends: 'Teman',
    notifications: 'Notifikasi',
    no_notifications: 'Tidak ada notifikasi',
    incoming_requests: 'Permintaan masuk',
    request_sent: 'Permintaan terkirim',
    from: 'Dari',
    loading: 'Memuat...',
    unknown: 'Tidak diketahui',
    public_posts: 'Posting publik',
    page_of: 'Halaman {page} dari {total}',
    prev: 'Sebelumnya',
    next: 'Selanjutnya',
    title: 'Judul',
    content_placeholder: 'Apa yang harus dikoreksi?',
    image_placeholder: 'URL Gambar (opsional)',
    write_comment: 'Tulis komentar...',
    send: 'Kirim',
    post: 'Kirimkan',
    post_button: 'Posting',
    posting_as: 'Memposting sebagai',
    find_friend: 'Cari Teman',
    search_by_name: 'Cari berdasarkan nama',
    friend_user_id_placeholder: 'ID pengguna teman',
    send_friend_request: 'Kirim Permintaan Pertemanan',
    friend_request: 'Permintaan pertemanan',
    accept: 'Terima',
    decline: 'Tolak',
    remove: 'Hapus',
    no_requests: 'Tidak ada permintaan',
    no_friends: 'Belum ada teman',
    blocked_users: 'Pengguna yang diblokir',
    no_blocked_users: 'Tidak ada pengguna yang diblokir',
    unblock: 'Buka blokir',
    no_more: 'Tidak ada lagi postingan',
    login_failed: 'Gagal masuk',
    load_comments: 'Muat komentar',
  },
  en: {
    comments: 'Comments',
    user: 'User',
    load_more: 'Load more',
    showing: 'Showing',
    showing_range: 'Showing {count} of {total}',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    posts: 'Posts',
    friends: 'Friends',
    notifications: 'Notifications',
    no_notifications: 'No notifications',
    incoming_requests: 'Incoming Requests',
    request_sent: 'Request sent',
    from: 'From',
    loading: 'Loading...',
    unknown: 'Unknown',
    public_posts: 'Public posts',
    page_of: 'Page {page} of {total}',
    prev: 'Prev',
    next: 'Next',
    title: 'Title',
    content_placeholder: 'What should be corrected?',
    image_placeholder: 'Image URL (optional)',
    write_comment: 'Write a comment...',
    send: 'Send',
    post: 'Post',
    post_button: 'Post',
    posting_as: 'Posting as',
    find_friend: 'Find Friend',
    search_by_name: 'Search by name',
    friend_user_id_placeholder: 'Friend user id',
    send_friend_request: 'Send Friend Request',
    friend_request: 'Friend request',
    accept: 'Accept',
    decline: 'Decline',
    remove: 'Remove',
    no_requests: 'No requests',
    no_friends: 'No friends yet',
    blocked_users: 'Blocked Users',
    no_blocked_users: 'No blocked users',
    unblock: 'Unblock',
    no_more: 'No more posts',
    login_failed: 'Login failed',
    load_comments: 'Load Comments',
  }
}

export default translations
