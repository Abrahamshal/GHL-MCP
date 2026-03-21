/**
 * GoHighLevel Courses/Memberships Tools
 * Tools for managing courses, products, and memberships
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class CoursesTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      // Course Importers
      {
        name: 'get_course_importers',
        description: 'Get list of all course import jobs/processes',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided)' },
            limit: { type: 'number', description: 'Max results to return' },
            offset: { type: 'number', description: 'Offset for pagination' }
          }
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course_importer',
        description: 'Create a new course import job to import courses from external sources',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Import job name' },
            sourceUrl: { type: 'string', description: 'Source URL to import from' },
            type: { type: 'string', description: 'Import type' },
          },
          required: ['name']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },

      // Course Products
      {
        name: 'get_course_products',
        description: 'Get all course products (purchasable course bundles)',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_course_product',
        description: 'Get a specific course product by ID',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['productId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course_product',
        description: 'Create a new course product',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Product title' },
            description: { type: 'string', description: 'Product description' },
            imageUrl: { type: 'string', description: 'Product image URL' },
            statementDescriptor: { type: 'string', description: 'Payment statement descriptor' },
          },
          required: ['title']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_course_product',
        description: 'Update a course product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Product title' },
            description: { type: 'string', description: 'Product description' },
            imageUrl: { type: 'string', description: 'Product image URL' },
          },
          required: ['productId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_course_product',
        description: 'Delete a course product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['productId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Categories
      {
        name: 'get_course_categories',
        description: 'Get all course categories',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course_category',
        description: 'Create a new course category',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Category title' },
          },
          required: ['title']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_course_category',
        description: 'Update a course category',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'Category ID' },
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Category title' },
          },
          required: ['categoryId', 'title']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_course_category',
        description: 'Delete a course category',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'Category ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['categoryId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Courses
      {
        name: 'get_courses',
        description: 'Get all courses',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' },
            categoryId: { type: 'string', description: 'Filter by category' }
          }
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_course',
        description: 'Get a specific course by ID',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course',
        description: 'Create a new course',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Course title' },
            description: { type: 'string', description: 'Course description' },
            thumbnailUrl: { type: 'string', description: 'Course thumbnail URL' },
            visibility: { type: 'string', enum: ['published', 'draft'], description: 'Course visibility' },
            categoryId: { type: 'string', description: 'Category ID to place course in' },
          },
          required: ['title']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_course',
        description: 'Update a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Course title' },
            description: { type: 'string', description: 'Course description' },
            thumbnailUrl: { type: 'string', description: 'Course thumbnail URL' },
            visibility: { type: 'string', enum: ['published', 'draft'], description: 'Course visibility' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_course',
        description: 'Delete a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Instructors
      {
        name: 'get_course_instructors',
        description: 'Get all instructors for a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'add_course_instructor',
        description: 'Add an instructor to a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
            userId: { type: 'string', description: 'User ID of instructor' },
            name: { type: 'string', description: 'Instructor display name' },
            bio: { type: 'string', description: 'Instructor bio' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },

      // Posts/Lessons
      {
        name: 'get_course_posts',
        description: 'Get all posts/lessons in a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_course_post',
        description: 'Get a specific course post/lesson',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            postId: { type: 'string', description: 'Post/Lesson ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId', 'postId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course_post',
        description: 'Create a new course post/lesson',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Post/lesson title' },
            contentType: { type: 'string', enum: ['video', 'text', 'quiz', 'assignment'], description: 'Content type' },
            content: { type: 'string', description: 'Post content (text/HTML)' },
            videoUrl: { type: 'string', description: 'Video URL (if video type)' },
            visibility: { type: 'string', enum: ['published', 'draft'], description: 'Visibility' },
          },
          required: ['courseId', 'title']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_course_post',
        description: 'Update a course post/lesson',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            postId: { type: 'string', description: 'Post/Lesson ID' },
            locationId: { type: 'string', description: 'Location ID' },
            title: { type: 'string', description: 'Post/lesson title' },
            content: { type: 'string', description: 'Post content' },
            videoUrl: { type: 'string', description: 'Video URL' },
            visibility: { type: 'string', enum: ['published', 'draft'], description: 'Visibility' },
          },
          required: ['courseId', 'postId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_course_post',
        description: 'Delete a course post/lesson',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            postId: { type: 'string', description: 'Post/Lesson ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId', 'postId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Offers
      {
        name: 'get_course_offers',
        description: 'Get all offers (pricing tiers) for a course product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['productId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_course_offer',
        description: 'Create a new offer for a course product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Offer name' },
            price: { type: 'number', description: 'Price in cents' },
            currency: { type: 'string', description: 'Currency code (e.g., USD)' },
            type: { type: 'string', enum: ['one-time', 'subscription'], description: 'Payment type' },
            interval: { type: 'string', enum: ['month', 'year'], description: 'Subscription interval (if subscription)' },
          },
          required: ['productId', 'name', 'price']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_course_offer',
        description: 'Update a course offer',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            offerId: { type: 'string', description: 'Offer ID' },
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Offer name' },
            price: { type: 'number', description: 'Price in cents' },
          },
          required: ['productId', 'offerId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_course_offer',
        description: 'Delete a course offer',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Course product ID' },
            offerId: { type: 'string', description: 'Offer ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['productId', 'offerId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Student/Enrollment Management
      {
        name: 'get_course_enrollments',
        description: 'Get all enrollments for a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            locationId: { type: 'string', description: 'Location ID' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' },
          },
          required: ['courseId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'enroll_contact_in_course',
        description: 'Enroll a contact in a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            contactId: { type: 'string', description: 'Contact ID to enroll' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId', 'contactId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'remove_course_enrollment',
        description: 'Remove a contact from a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            contactId: { type: 'string', description: 'Contact ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId', 'contactId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      },

      // Progress tracking
      {
        name: 'get_student_progress',
        description: 'Get a student\'s progress in a course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            contactId: { type: 'string', description: 'Contact/Student ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['courseId', 'contactId']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_lesson_completion',
        description: 'Mark a lesson as complete/incomplete for a student',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: { type: 'string', description: 'Course ID' },
            postId: { type: 'string', description: 'Post/Lesson ID' },
            contactId: { type: 'string', description: 'Contact/Student ID' },
            locationId: { type: 'string', description: 'Location ID' },
            completed: { type: 'boolean', description: 'Whether lesson is completed' },
          },
          required: ['courseId', 'postId', 'contactId', 'completed']
        },
        _meta: {
          labels: {
            category: "courses",
            access: "write",
            complexity: "simple"
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      // Course Importers
      case 'get_course_importers': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/courses/courses-exporter?${params.toString()}`);
      }
      case 'create_course_importer': {
        return this.ghlClient.makeRequest('POST', `/courses/courses-exporter`, {
          locationId,
          name: args.name,
          sourceUrl: args.sourceUrl,
          type: args.type
        });
      }

      // Course Products
      case 'get_course_products': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/courses/courses-exporter/products?${params.toString()}`);
      }
      case 'get_course_product': {
        return this.ghlClient.makeRequest('GET', `/courses/courses-exporter/products/${args.productId}?locationId=${locationId}`);
      }
      case 'create_course_product': {
        return this.ghlClient.makeRequest('POST', `/courses/courses-exporter/products`, {
          locationId,
          title: args.title,
          description: args.description,
          imageUrl: args.imageUrl,
          statementDescriptor: args.statementDescriptor
        });
      }
      case 'update_course_product': {
        const body: Record<string, unknown> = { locationId };
        if (args.title) body.title = args.title;
        if (args.description) body.description = args.description;
        if (args.imageUrl) body.imageUrl = args.imageUrl;
        return this.ghlClient.makeRequest('PUT', `/courses/courses-exporter/products/${args.productId}`, body);
      }
      case 'delete_course_product': {
        return this.ghlClient.makeRequest('DELETE', `/courses/courses-exporter/products/${args.productId}?locationId=${locationId}`);
      }

      // Categories
      case 'get_course_categories': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/courses/categories?${params.toString()}`);
      }
      case 'create_course_category': {
        return this.ghlClient.makeRequest('POST', `/courses/categories`, { locationId, title: args.title });
      }
      case 'update_course_category': {
        return this.ghlClient.makeRequest('PUT', `/courses/categories/${args.categoryId}`, { locationId, title: args.title });
      }
      case 'delete_course_category': {
        return this.ghlClient.makeRequest('DELETE', `/courses/categories/${args.categoryId}?locationId=${locationId}`);
      }

      // Courses
      case 'get_courses': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        if (args.categoryId) params.append('categoryId', String(args.categoryId));
        return this.ghlClient.makeRequest('GET', `/courses?${params.toString()}`);
      }
      case 'get_course': {
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}?locationId=${locationId}`);
      }
      case 'create_course': {
        const body: Record<string, unknown> = { locationId, title: args.title };
        if (args.description) body.description = args.description;
        if (args.thumbnailUrl) body.thumbnailUrl = args.thumbnailUrl;
        if (args.visibility) body.visibility = args.visibility;
        if (args.categoryId) body.categoryId = args.categoryId;
        return this.ghlClient.makeRequest('POST', `/courses`, body);
      }
      case 'update_course': {
        const body: Record<string, unknown> = { locationId };
        if (args.title) body.title = args.title;
        if (args.description) body.description = args.description;
        if (args.thumbnailUrl) body.thumbnailUrl = args.thumbnailUrl;
        if (args.visibility) body.visibility = args.visibility;
        return this.ghlClient.makeRequest('PUT', `/courses/${args.courseId}`, body);
      }
      case 'delete_course': {
        return this.ghlClient.makeRequest('DELETE', `/courses/${args.courseId}?locationId=${locationId}`);
      }

      // Instructors
      case 'get_course_instructors': {
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}/instructors?locationId=${locationId}`);
      }
      case 'add_course_instructor': {
        const body: Record<string, unknown> = { locationId };
        if (args.userId) body.userId = args.userId;
        if (args.name) body.name = args.name;
        if (args.bio) body.bio = args.bio;
        return this.ghlClient.makeRequest('POST', `/courses/${args.courseId}/instructors`, body);
      }

      // Posts/Lessons
      case 'get_course_posts': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}/posts?${params.toString()}`);
      }
      case 'get_course_post': {
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}/posts/${args.postId}?locationId=${locationId}`);
      }
      case 'create_course_post': {
        const body: Record<string, unknown> = { locationId, title: args.title };
        if (args.contentType) body.contentType = args.contentType;
        if (args.content) body.content = args.content;
        if (args.videoUrl) body.videoUrl = args.videoUrl;
        if (args.visibility) body.visibility = args.visibility;
        return this.ghlClient.makeRequest('POST', `/courses/${args.courseId}/posts`, body);
      }
      case 'update_course_post': {
        const body: Record<string, unknown> = { locationId };
        if (args.title) body.title = args.title;
        if (args.content) body.content = args.content;
        if (args.videoUrl) body.videoUrl = args.videoUrl;
        if (args.visibility) body.visibility = args.visibility;
        return this.ghlClient.makeRequest('PUT', `/courses/${args.courseId}/posts/${args.postId}`, body);
      }
      case 'delete_course_post': {
        return this.ghlClient.makeRequest('DELETE', `/courses/${args.courseId}/posts/${args.postId}?locationId=${locationId}`);
      }

      // Offers
      case 'get_course_offers': {
        return this.ghlClient.makeRequest('GET', `/courses/courses-exporter/products/${args.productId}/offers?locationId=${locationId}`);
      }
      case 'create_course_offer': {
        const body: Record<string, unknown> = {
          locationId,
          name: args.name,
          price: args.price
        };
        if (args.currency) body.currency = args.currency;
        if (args.type) body.type = args.type;
        if (args.interval) body.interval = args.interval;
        return this.ghlClient.makeRequest('POST', `/courses/courses-exporter/products/${args.productId}/offers`, body);
      }
      case 'update_course_offer': {
        const body: Record<string, unknown> = { locationId };
        if (args.name) body.name = args.name;
        if (args.price) body.price = args.price;
        return this.ghlClient.makeRequest('PUT', `/courses/courses-exporter/products/${args.productId}/offers/${args.offerId}`, body);
      }
      case 'delete_course_offer': {
        return this.ghlClient.makeRequest('DELETE', `/courses/courses-exporter/products/${args.productId}/offers/${args.offerId}?locationId=${locationId}`);
      }

      // Enrollments
      case 'get_course_enrollments': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}/enrollments?${params.toString()}`);
      }
      case 'enroll_contact_in_course': {
        return this.ghlClient.makeRequest('POST', `/courses/${args.courseId}/enrollments`, {
          locationId,
          contactId: args.contactId
        });
      }
      case 'remove_course_enrollment': {
        return this.ghlClient.makeRequest('DELETE', `/courses/${args.courseId}/enrollments/${args.contactId}?locationId=${locationId}`);
      }

      // Progress
      case 'get_student_progress': {
        return this.ghlClient.makeRequest('GET', `/courses/${args.courseId}/progress/${args.contactId}?locationId=${locationId}`);
      }
      case 'update_lesson_completion': {
        return this.ghlClient.makeRequest('POST', `/courses/${args.courseId}/posts/${args.postId}/completion`, {
          locationId,
          contactId: args.contactId,
          completed: args.completed
        });
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
