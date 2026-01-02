"use client";

import BlogsManager from "@/components/dashboard/BlogsManager";

export default function VolunteerBlogsPage() {
    return <BlogsManager mode="approve" basePath="/volunteer/blogs" />;
}
