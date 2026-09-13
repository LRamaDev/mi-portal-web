(function exposeCloudConfig(root) {
  root.TercerTiempoCloudConfig = Object.freeze({
    enabled: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
    tableName: 'user_app_state'
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
