import type { Role } from "./store";

export function roleHome(role?: Role) {
  return role === "admin"
    ? "/admin"
    : role === "mentor"
      ? "/mentor-command-center"
      : role === "judge"
        ? "/judge-command-center"
        : "/dashboard";
}
