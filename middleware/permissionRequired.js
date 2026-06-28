export function permissionRequired(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: [] });
    }

    // Admin without explicit permissions gets full access
    const userPerms = req.user.permissions || [];
    if (userPerms.includes('*')) return next();
    if (req.user.role === 'admin' && (!req.user.permissions || req.user.permissions.length === 0)) return next();

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(p => userPerms.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لهذا الإجراء', data: [] });
    }

    next();
  };
}
