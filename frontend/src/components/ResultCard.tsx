    import React from "react";
    import { VEGETABLE_DATA } from "../data/vegetables";

    type PredictionResult = {
    class_name: string;
    confidence: number;
    };

    interface ResultCardProps {
    result: PredictionResult;
    }

    export default function ResultCard({ result }: ResultCardProps) {
    const vegetable =
        result && VEGETABLE_DATA[result.class_name]
        ? VEGETABLE_DATA[result.class_name]
        : null;

    if (!vegetable) return null;

    return (
        <div className="ios-card p-8 mt-8">

        {/* Header */}
        <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            {vegetable.thai_name}
            </h2>

            <p className="text-gray-500 italic mt-1">
            {vegetable.scientific_name}
            </p>

            <div className="mt-2 text-sm text-gray-600">
            Confidence {(result.confidence * 100).toFixed(2)}%
            </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 my-6" />

        {/* Content */}
        <div className="space-y-6 text-gray-800">

            <div>
            <h4 className="font-semibold text-gray-900 mb-1">
                📍 ชื่อท้องถิ่น
            </h4>
            <p className="text-gray-600">
                {vegetable.local_name}
            </p>
            </div>

            <div>
            <h4 className="font-semibold text-gray-900 mb-1">
                🌱 ลักษณะทางพฤกษศาสตร์
            </h4>
            <p className="text-gray-600">
                {vegetable.description}
            </p>
            </div>

            <div>
            <h4 className="font-semibold text-gray-900 mb-1">
                💊 สรรพคุณ
            </h4>
            <p className="text-gray-600">
                {vegetable.benefits}
            </p>
            </div>

            <div>
            <h4 className="font-semibold text-gray-900 mb-1">
                🍽 เมนูแนะนำ
            </h4>
            <ul className="list-disc list-inside text-gray-600">
                {vegetable.recommended_menu.map((menu: string, i: number) => (
                <li key={i}>{menu}</li>
                ))}
            </ul>
            </div>

        </div>
        </div>
    );
    }
