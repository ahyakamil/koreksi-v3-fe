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
  news: string
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
  file_too_large: string
  show_post_form: string
  hide_post_form: string
  now: string
  s: string
  m: string
  h: string
  d: string
  share: string
  show_all_comments: string
  reply: string
  show_replies: string
  load_more_replies: string
  no_comments: string
  by: string
  published: string
  news_not_found: string
  post_not_found: string
  failed_to_load: string
  organizations: string
  show_all: string
  hide: string
  back_to_organizations: string
  cancel: string
  create: string
  create_organization: string
  create_space: string
  delete: string
  description: string
  edit: string
  edit_organization: string
  failed_to_create_organization: string
  failed_to_create_space: string
  failed_to_delete_organization: string
  failed_to_delete_space: string
  failed_to_invite_user: string
  failed_to_join_organization: string
  failed_to_leave_organization: string
  failed_to_load_organization: string
  failed_to_remove_member: string
  failed_to_review_news: string
  failed_to_update_organization: string
  failed_to_update_role: string
  failed_to_update_space: string
  failed_to_upload_image: string
  invite: string
  invite_user: string
  join_organization: string
  joining: string
  manage_news: string
  members: string
  my_organizations: string
  no_news_available: string
  no_organizations_found: string
  no_spaces_found: string
  organization_not_found: string
  published_news: string
  search_users_by_name_or_email: string
  sending: string
  spaces: string
  update: string
  world_organizations: string
  are_you_sure_delete_organization: string
  are_you_sure_delete_space: string
  are_you_sure_remove_member: string
  enter_rejection_reason: string
  join_to_see_published_news: string
  become_member_to_access_news: string
  no_image: string
  post_media: string
  loading_friends: string
  not_found: string
  type_a_message: string
  user_role_user: string
  user_role_author: string
  user_role_editor: string
  user_role_admin: string
  back_to_news: string
  create_news: string
  space: string
  select_a_space: string
  caption: string
  optional_caption_for_the_image: string
  content: string
  write_your_news_content_here: string
  status: string
  save_as_draft: string
  submit_for_review: string
  creating: string
  create_news_button: string
  you_are_not_a_member: string
  failed_to_create_news: string
  back_to_organization: string
  all: string
  draft: string
  need_review: string
  rejected: string
  no_news_found_in_this_category: string
  in: string
  review_notes: string
  publish: string
  reject: string
  failed_to_delete_news: string
  are_you_sure_delete_news: string
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
    news: 'Berita',
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
    file_too_large: '{name} terlalu besar. Ukuran maksimal adalah 2MB.',
    show_post_form: 'Bikin postingan',
    hide_post_form: 'Batalkan postingan',
    now: 'sekarang',
    s: 'd',
    m: 'm',
    h: 'j',
    d: 'h',
    share: 'Bagikan',
    show_all_comments: 'Tampilkan semua komentar',
    reply: 'Balas',
    show_replies: 'Tampilkan balasan',
    load_more_replies: 'Muat lebih banyak balasan',
    no_comments: 'Belum ada komentar.',
    by: 'oleh',
    published: 'Diterbitkan',
    news_not_found: 'Berita tidak ditemukan',
    post_not_found: 'Postingan tidak ditemukan',
    failed_to_load: 'Gagal memuat',
    organizations: 'Organisasi',
    show_all: 'Tampilkan semua',
    hide: 'Sembunyikan',
    back_to_organizations: 'Kembali ke Organisasi',
    cancel: 'Batal',
    create: 'Buat',
    create_organization: 'Buat Organisasi',
    create_space: 'Buat Ruang',
    delete: 'Hapus',
    description: 'Deskripsi',
    edit: 'Edit',
    edit_organization: 'Edit Organisasi',
    failed_to_create_organization: 'Gagal membuat organisasi',
    failed_to_create_space: 'Gagal membuat ruang',
    failed_to_delete_organization: 'Gagal menghapus organisasi',
    failed_to_delete_space: 'Gagal menghapus ruang',
    failed_to_invite_user: 'Gagal mengundang pengguna',
    failed_to_join_organization: 'Gagal bergabung dengan organisasi',
    failed_to_leave_organization: 'Gagal keluar dari organisasi',
    failed_to_load_organization: 'Gagal memuat organisasi',
    failed_to_remove_member: 'Gagal menghapus anggota',
    failed_to_review_news: 'Gagal meninjau berita',
    failed_to_update_organization: 'Gagal memperbarui organisasi',
    failed_to_update_role: 'Gagal memperbarui peran',
    failed_to_update_space: 'Gagal memperbarui ruang',
    failed_to_upload_image: 'Gagal mengunggah gambar',
    invite: 'Undang',
    invite_user: 'Undang Pengguna',
    join_organization: 'Bergabung dengan Organisasi',
    joining: 'Bergabung...',
    manage_news: 'Kelola Berita',
    members: 'Anggota',
    my_organizations: 'Organisasi Saya',
    no_news_available: 'Tidak ada berita tersedia.',
    no_organizations_found: 'Tidak ada organisasi ditemukan.',
    no_spaces_found: 'Tidak ada ruang ditemukan.',
    organization_not_found: 'Organisasi tidak ditemukan',
    published_news: 'Berita yang Diterbitkan',
    search_users_by_name_or_email: 'Cari pengguna berdasarkan nama atau email',
    sending: 'Mengirim...',
    spaces: 'Ruang',
    update: 'Perbarui',
    world_organizations: 'Semua Organisasi',
    are_you_sure_delete_organization: 'Apakah Anda yakin ingin menghapus organisasi ini?',
    are_you_sure_delete_space: 'Apakah Anda yakin ingin menghapus ruang ini?',
    are_you_sure_remove_member: 'Apakah Anda yakin ingin menghapus anggota ini?',
    enter_rejection_reason: 'Masukkan alasan penolakan:',
    join_to_see_published_news: 'Bergabung untuk Melihat Berita yang Diterbitkan',
    become_member_to_access_news: 'Menjadi anggota organisasi ini untuk melihat dan mengakses semua artikel berita yang diterbitkan.',
    no_image: 'Tidak ada gambar',
    post_media: 'Media postingan',
    loading_friends: 'Memuat teman...',
    not_found: 'Tidak ditemukan',
    type_a_message: 'Ketik pesan...',
    user_role_user: 'Pengguna',
    user_role_author: 'Penulis',
    user_role_editor: 'Editor',
    user_role_admin: 'Admin',
    back_to_news: 'Kembali ke Berita',
    create_news: 'Buat Berita',
    space: 'Ruang',
    select_a_space: 'Pilih ruang',
    caption: 'Keterangan',
    optional_caption_for_the_image: 'Keterangan opsional untuk gambar',
    content: 'Konten',
    write_your_news_content_here: 'Tulis konten berita Anda di sini...',
    status: 'Status',
    save_as_draft: 'Simpan sebagai Draf (Anda dapat mengedit nanti)',
    submit_for_review: 'Kirim untuk Ditinjau (admin/editor akan meninjau)',
    creating: 'Membuat...',
    create_news_button: 'Buat Berita',
    you_are_not_a_member: 'Anda bukan anggota organisasi ini.',
    failed_to_create_news: 'Gagal membuat berita',
    back_to_organization: 'Kembali ke Organisasi',
    all: 'Semua',
    draft: 'Draf',
    need_review: 'Perlu Ditinjau',
    rejected: 'Ditolak',
    no_news_found_in_this_category: 'Tidak ada berita ditemukan di kategori ini.',
    in: 'di',
    review_notes: 'Catatan Tinjauan',
    publish: 'Terbitkan',
    reject: 'Tolak',
    failed_to_delete_news: 'Gagal menghapus berita',
    are_you_sure_delete_news: 'Apakah Anda yakin ingin menghapus berita ini?',
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
    news: 'News',
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
    file_too_large: '{name} is too large. Maximum size is 2MB.',
    show_post_form: 'Create Post',
    hide_post_form: 'Cancel Post',
    now: 'now',
    s: 's',
    m: 'm',
    h: 'h',
    d: 'd',
    share: 'Share',
    show_all_comments: 'Show all comments',
    reply: 'Reply',
    show_replies: 'Show replies',
    load_more_replies: 'Load more replies',
    no_comments: 'No comments yet.',
    by: 'by',
    published: 'Published',
    news_not_found: 'News not found',
    post_not_found: 'Post not found',
    failed_to_load: 'Failed to load',
    organizations: 'Organizations',
    show_all: 'Show all',
    hide: 'Hide',
    back_to_organizations: 'Back to Organizations',
    cancel: 'Cancel',
    create: 'Create',
    create_organization: 'Create Organization',
    create_space: 'Create Space',
    delete: 'Delete',
    description: 'Description',
    edit: 'Edit',
    edit_organization: 'Edit Organization',
    failed_to_create_organization: 'Failed to create organization',
    failed_to_create_space: 'Failed to create space',
    failed_to_delete_organization: 'Failed to delete organization',
    failed_to_delete_space: 'Failed to delete space',
    failed_to_invite_user: 'Failed to invite user',
    failed_to_join_organization: 'Failed to join organization',
    failed_to_leave_organization: 'Failed to leave organization',
    failed_to_load_organization: 'Failed to load organization',
    failed_to_remove_member: 'Failed to remove member',
    failed_to_review_news: 'Failed to review news',
    failed_to_update_organization: 'Failed to update organization',
    failed_to_update_role: 'Failed to update role',
    failed_to_update_space: 'Failed to update space',
    failed_to_upload_image: 'Failed to upload image',
    invite: 'Invite',
    invite_user: 'Invite User',
    join_organization: 'Join Organization',
    joining: 'Joining...',
    manage_news: 'Manage News',
    members: 'Members',
    my_organizations: 'My Organizations',
    no_news_available: 'No news available.',
    no_organizations_found: 'No organizations found.',
    no_spaces_found: 'No spaces found.',
    organization_not_found: 'Organization not found',
    published_news: 'Published News',
    search_users_by_name_or_email: 'Search users by name or email',
    sending: 'Sending...',
    spaces: 'Spaces',
    update: 'Update',
    world_organizations: 'World Organizations',
    are_you_sure_delete_organization: 'Are you sure you want to delete this organization?',
    are_you_sure_delete_space: 'Are you sure you want to delete this space?',
    are_you_sure_remove_member: 'Are you sure you want to remove this member?',
    enter_rejection_reason: 'Enter rejection reason:',
    join_to_see_published_news: 'Join to See Published News',
    become_member_to_access_news: 'Become a member of this organization to view and access all published news articles.',
    no_image: 'No image',
    post_media: 'Post media',
    loading_friends: 'Loading friends...',
    not_found: 'Not found',
    type_a_message: 'Type a message...',
    user_role_user: 'User',
    user_role_author: 'Author',
    user_role_editor: 'Editor',
    user_role_admin: 'Admin',
    back_to_news: 'Back to News',
    create_news: 'Create News',
    space: 'Space',
    select_a_space: 'Select a space',
    caption: 'Caption',
    optional_caption_for_the_image: 'Optional caption for the image',
    content: 'Content',
    write_your_news_content_here: 'Write your news content here...',
    status: 'Status',
    save_as_draft: 'Save as Draft (you can edit later)',
    submit_for_review: 'Submit for Review (admins/editors will review)',
    creating: 'Creating...',
    create_news_button: 'Create News',
    you_are_not_a_member: 'You are not a member of this organization.',
    failed_to_create_news: 'Failed to create news',
    back_to_organization: 'Back to Organization',
    all: 'All',
    draft: 'Draft',
    need_review: 'Need Review',
    rejected: 'Rejected',
    no_news_found_in_this_category: 'No news found in this category.',
    in: 'in',
    review_notes: 'Review Notes',
    publish: 'Publish',
    reject: 'Reject',
    failed_to_delete_news: 'Failed to delete news',
    are_you_sure_delete_news: 'Are you sure you want to delete this news?',
  }
}

export default translations
