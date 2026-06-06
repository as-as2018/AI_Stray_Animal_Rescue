import React, { useState } from 'react';

export default function DataTable({ columns, data, onSort, sortConfig, onPageChange, page, totalPages }) {
    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th 
                                key={col.key} 
                                onClick={() => col.sortable && onSort && onSort(col.key)}
                                style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                            >
                                <div className="flex-gap">
                                    {col.label}
                                    {sortConfig?.key === col.key && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={row.id || i}>
                            {columns.map((col) => (
                                <td key={col.key}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="text-center" style={{ padding: '32px' }}>
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {(page !== undefined && totalPages !== undefined) && (
                <div className="pagination">
                    <button 
                        className="page-btn" 
                        disabled={page === 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Prev
                    </button>
                    <span className="text-sm">Page {page} of {Math.max(1, totalPages)}</span>
                    <button 
                        className="page-btn" 
                        disabled={page === totalPages || totalPages === 0}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
