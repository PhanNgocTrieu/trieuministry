"use client";

import BlogsManager from "@/components/dashboard/BlogsManager";

export default function AdminBlogsPage() {
    return <BlogsManager mode="admin" basePath="/admin/blogs" />;
}
