from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class SmartNavPagination(PageNumberPagination):
    """
    Standard pagination for SmartNav endpoints.
    Allows clients to control page size with `page_size` query param,
    and supports bypass via `all=true` for full map dataset rendering.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        # Allow client to request unpaginated results (e.g. for complete map venue rendering)
        if request.query_params.get('all', '').lower() in ('true', '1', 'yes'):
            return None
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

# Defines pagination settings for campus API responses.