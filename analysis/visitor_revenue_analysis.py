#!/usr/bin/env python3
"""
Webflow Visitor-to-Revenue Analysis by Segment and Geography
Analyzes conversion funnel from visitors to paid subscriptions with revenue metrics
"""

import os
import json
import subprocess
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

class WebflowVisitorRevenueAnalyzer:
    def __init__(self):
        self.analysis_date = datetime.now().strftime('%Y-%m-%d')
        self.results = {}

    def execute_snowflake_query(self, query: str, description: str = "") -> pd.DataFrame:
        """Execute a Snowflake query and return results as DataFrame"""
        print(f"\n{'='*60}")
        print(f"Executing: {description}")
        print(f"{'='*60}")

        try:
            # Use npm run snowflake command
            cmd = ['npm', 'run', 'snowflake', '--', 'query', query]
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='/Users/rachelwolan/agent-chief-of-staff')

            if result.returncode != 0:
                print(f"Error executing query: {result.stderr}")
                return pd.DataFrame()

            # Parse JSON output
            output_lines = result.stdout.strip().split('\n')
            for line in reversed(output_lines):
                if line.startswith('[') or line.startswith('{'):
                    try:
                        data = json.loads(line)
                        if isinstance(data, list):
                            return pd.DataFrame(data)
                    except json.JSONDecodeError:
                        continue

            return pd.DataFrame()

        except Exception as e:
            print(f"Error: {str(e)}")
            return pd.DataFrame()

    def analyze_visitor_metrics_by_geography(self):
        """Analyze visitor metrics by geographic region"""
        query = """
        WITH date_range AS (
            SELECT
                DATEADD(day, -30, CURRENT_DATE()) AS start_date,
                CURRENT_DATE() AS end_date
        ),
        visitor_metrics AS (
            SELECT
                COALESCE(v.CUSTOM_REGION, 'Unknown') AS region,
                COUNT(DISTINCT v.ID_VISITOR) AS unique_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_NEW_VISITOR THEN v.ID_VISITOR END) AS new_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_PRE_SIGNUP_VISITOR THEN v.ID_VISITOR END) AS pre_signup_visitors
            FROM analytics.webflow.DAILY_MARKETING_VISITOR_DETAILS v
            CROSS JOIN date_range dr
            WHERE v.DATE_DAY BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1
        )
        SELECT
            region,
            unique_visitors,
            new_visitors,
            pre_signup_visitors,
            ROUND(100.0 * pre_signup_visitors / NULLIF(unique_visitors, 0), 2) AS pre_signup_rate,
            ROUND(100.0 * new_visitors / NULLIF(unique_visitors, 0), 2) AS new_visitor_rate
        FROM visitor_metrics
        WHERE unique_visitors > 100
        ORDER BY unique_visitors DESC
        LIMIT 25
        """

        df = self.execute_snowflake_query(query, "Visitor Metrics by Geography (Last 30 Days)")
        if not df.empty:
            self.results['geography_visitors'] = df
            print(f"\nTop Geographic Regions by Visitor Volume:")
            print(df.head(10).to_string(index=False))
        return df

    def analyze_visitor_metrics_by_channel(self):
        """Analyze visitor metrics by marketing channel"""
        query = """
        WITH date_range AS (
            SELECT
                DATEADD(day, -30, CURRENT_DATE()) AS start_date,
                CURRENT_DATE() AS end_date
        ),
        channel_metrics AS (
            SELECT
                COALESCE(v.DIM_CHANNEL_CATEGORY, 'Unknown') AS channel_category,
                COALESCE(v.DIM_CHANNEL, 'Unknown') AS channel,
                COUNT(DISTINCT v.ID_VISITOR) AS unique_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_NEW_VISITOR THEN v.ID_VISITOR END) AS new_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_PRE_SIGNUP_VISITOR THEN v.ID_VISITOR END) AS pre_signup_visitors
            FROM analytics.webflow.DAILY_MARKETING_VISITOR_DETAILS v
            CROSS JOIN date_range dr
            WHERE v.DATE_DAY BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1, 2
        )
        SELECT
            channel_category,
            channel,
            unique_visitors,
            new_visitors,
            pre_signup_visitors,
            ROUND(100.0 * pre_signup_visitors / NULLIF(unique_visitors, 0), 2) AS pre_signup_rate,
            ROUND(100.0 * new_visitors / NULLIF(unique_visitors, 0), 2) AS new_visitor_rate
        FROM channel_metrics
        WHERE unique_visitors > 100
        ORDER BY unique_visitors DESC
        LIMIT 30
        """

        df = self.execute_snowflake_query(query, "Visitor Metrics by Marketing Channel (Last 30 Days)")
        if not df.empty:
            self.results['channel_visitors'] = df
            print(f"\nTop Marketing Channels by Visitor Volume:")
            print(df.head(10).to_string(index=False))
        return df

    def analyze_revenue_by_segment(self):
        """Analyze revenue metrics by customer segment"""
        query = """
        WITH current_revenue AS (
            SELECT
                COALESCE(BUSINESS_CATEGORY, 'Unknown') AS segment,
                COALESCE(PLAN_OBJECT_TIER, 'Unknown') AS plan_tier,
                COUNT(DISTINCT WF_CUSTOMER_ID) AS customer_count,
                SUM(MRR) AS total_mrr,
                AVG(MRR) AS avg_mrr,
                SUM(CASE WHEN IS_NEW_BUSINESS_MRR THEN MRR ELSE 0 END) AS new_business_mrr,
                SUM(EXPANSION_MRR) AS expansion_mrr,
                SUM(CONTRACTION_MRR) AS contraction_mrr,
                SUM(CHURNED_MRR) AS churned_mrr
            FROM analytics.webflow.TOOL_PLAN_OBJECT_DAILY_CURRENT
            WHERE MRR > 0
            GROUP BY 1, 2
        )
        SELECT
            segment,
            plan_tier,
            customer_count,
            ROUND(total_mrr, 0) AS total_mrr,
            ROUND(avg_mrr, 2) AS avg_mrr,
            ROUND(new_business_mrr, 0) AS new_business_mrr,
            ROUND(expansion_mrr, 0) AS expansion_mrr,
            ROUND(contraction_mrr, 0) AS contraction_mrr,
            ROUND(churned_mrr, 0) AS churned_mrr
        FROM current_revenue
        WHERE customer_count >= 10
        ORDER BY total_mrr DESC
        LIMIT 20
        """

        df = self.execute_snowflake_query(query, "Current Revenue by Customer Segment")
        if not df.empty:
            self.results['revenue_segments'] = df
            print(f"\nRevenue by Customer Segment:")
            print(df.head(10).to_string(index=False))
        return df

    def analyze_signup_to_revenue_conversion(self):
        """Analyze conversion from signups to revenue"""
        query = """
        WITH date_range AS (
            SELECT
                DATEADD(day, -90, CURRENT_DATE()) AS start_date,
                DATEADD(day, -1, CURRENT_DATE()) AS end_date
        ),
        daily_signups AS (
            SELECT
                DATE_TRUNC('day', TIMESTAMP) AS signup_date,
                COUNT(DISTINCT USER_ID) AS signups
            FROM analytics.webflow.FCT_USER_CREATED
            CROSS JOIN date_range dr
            WHERE DATE_TRUNC('day', TIMESTAMP) BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1
        ),
        new_subscriptions AS (
            SELECT
                DATE_TRUNC('day', CREATED_AT) AS subscription_date,
                COUNT(DISTINCT USER_ID) AS new_subscriptions,
                SUM(MRR) AS new_mrr
            FROM analytics.webflow.REPORT__GOOGLE_NEW_FIRST_SUBSCRIPTION_EVENT
            CROSS JOIN date_range dr
            WHERE DATE_TRUNC('day', CREATED_AT) BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1
        ),
        daily_metrics AS (
            SELECT
                COALESCE(s.signup_date, n.subscription_date) AS date,
                COALESCE(s.signups, 0) AS signups,
                COALESCE(n.new_subscriptions, 0) AS new_subscriptions,
                COALESCE(n.new_mrr, 0) AS new_mrr
            FROM daily_signups s
            FULL OUTER JOIN new_subscriptions n ON s.signup_date = n.subscription_date
        )
        SELECT
            DATE_TRUNC('week', date) AS week,
            SUM(signups) AS total_signups,
            SUM(new_subscriptions) AS total_new_subscriptions,
            ROUND(SUM(new_mrr), 0) AS total_new_mrr,
            ROUND(100.0 * SUM(new_subscriptions) / NULLIF(SUM(signups), 0), 2) AS conversion_rate,
            ROUND(SUM(new_mrr) / NULLIF(SUM(new_subscriptions), 0), 2) AS avg_mrr_per_conversion
        FROM daily_metrics
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 13
        """

        df = self.execute_snowflake_query(query, "Signup to Subscription Conversion (Last 90 Days)")
        if not df.empty:
            self.results['signup_conversion'] = df
            print(f"\nWeekly Signup to Revenue Conversion:")
            print(df.head(10).to_string(index=False))
        return df

    def analyze_geo_channel_crossover(self):
        """Analyze the intersection of geography and channel performance"""
        query = """
        WITH date_range AS (
            SELECT
                DATEADD(day, -30, CURRENT_DATE()) AS start_date,
                CURRENT_DATE() AS end_date
        ),
        geo_channel_metrics AS (
            SELECT
                COALESCE(v.CUSTOM_REGION, 'Unknown') AS region,
                COALESCE(v.DIM_CHANNEL_CATEGORY, 'Unknown') AS channel_category,
                COUNT(DISTINCT v.ID_VISITOR) AS unique_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_PRE_SIGNUP_VISITOR THEN v.ID_VISITOR END) AS pre_signup_visitors
            FROM analytics.webflow.DAILY_MARKETING_VISITOR_DETAILS v
            CROSS JOIN date_range dr
            WHERE v.DATE_DAY BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1, 2
            HAVING unique_visitors >= 100
        )
        SELECT
            region,
            channel_category,
            unique_visitors,
            pre_signup_visitors,
            ROUND(100.0 * pre_signup_visitors / NULLIF(unique_visitors, 0), 2) AS pre_signup_rate
        FROM geo_channel_metrics
        WHERE region IN (
            SELECT region
            FROM geo_channel_metrics
            GROUP BY region
            HAVING SUM(unique_visitors) >= 1000
        )
        ORDER BY unique_visitors DESC
        LIMIT 50
        """

        df = self.execute_snowflake_query(query, "Geography x Channel Performance Matrix")
        if not df.empty:
            self.results['geo_channel_matrix'] = df
            print(f"\nTop Geography-Channel Combinations:")
            print(df.head(15).to_string(index=False))
        return df

    def analyze_visitor_trends(self):
        """Analyze visitor and conversion trends over time"""
        query = """
        WITH date_range AS (
            SELECT
                DATEADD(day, -30, CURRENT_DATE()) AS start_date,
                CURRENT_DATE() AS end_date
        ),
        daily_visitor_metrics AS (
            SELECT
                v.DATE_DAY AS date,
                COUNT(DISTINCT v.ID_VISITOR) AS unique_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_NEW_VISITOR THEN v.ID_VISITOR END) AS new_visitors,
                COUNT(DISTINCT CASE WHEN v.IS_PRE_SIGNUP_VISITOR THEN v.ID_VISITOR END) AS pre_signup_visitors
            FROM analytics.webflow.DAILY_MARKETING_VISITOR_DETAILS v
            CROSS JOIN date_range dr
            WHERE v.DATE_DAY BETWEEN dr.start_date AND dr.end_date
            GROUP BY 1
        )
        SELECT
            date,
            unique_visitors,
            new_visitors,
            pre_signup_visitors,
            ROUND(100.0 * pre_signup_visitors / NULLIF(unique_visitors, 0), 2) AS pre_signup_rate,
            ROUND(100.0 * new_visitors / NULLIF(unique_visitors, 0), 2) AS new_visitor_rate,
            AVG(unique_visitors) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS visitors_7d_avg,
            AVG(pre_signup_visitors) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS pre_signups_7d_avg
        FROM daily_visitor_metrics
        ORDER BY date DESC
        """

        df = self.execute_snowflake_query(query, "Daily Visitor Trends (Last 30 Days)")
        if not df.empty:
            self.results['visitor_trends'] = df
            print(f"\nRecent Visitor Trend Summary:")
            print(df.head(7).to_string(index=False))
        return df

    def generate_insights_and_recommendations(self):
        """Generate actionable insights and recommendations based on analysis"""
        print(f"\n{'='*80}")
        print("EXECUTIVE SUMMARY: VISITOR-TO-REVENUE ANALYSIS")
        print(f"{'='*80}")
        print(f"Analysis Date: {self.analysis_date}")
        print(f"Analysis Period: Last 30-90 days")

        insights = []
        recommendations = []

        # Geography insights
        if 'geography_visitors' in self.results and not self.results['geography_visitors'].empty:
            geo_df = self.results['geography_visitors']
            top_geo = geo_df.iloc[0]
            high_conv_geos = geo_df[geo_df['pre_signup_rate'] > geo_df['pre_signup_rate'].median()]

            insights.append(f"• Top visitor region: {top_geo['region']} with {int(top_geo['unique_visitors']):,} visitors")
            insights.append(f"• {len(high_conv_geos)} regions show above-median pre-signup conversion rates")

            if len(high_conv_geos) > 0:
                best_converting = high_conv_geos.nlargest(3, 'pre_signup_rate')
                for _, row in best_converting.iterrows():
                    insights.append(f"  - {row['region']}: {row['pre_signup_rate']}% conversion rate")

        # Channel insights
        if 'channel_visitors' in self.results and not self.results['channel_visitors'].empty:
            chan_df = self.results['channel_visitors']
            top_channel = chan_df.iloc[0]
            high_conv_channels = chan_df[chan_df['pre_signup_rate'] > chan_df['pre_signup_rate'].median()]

            insights.append(f"• Top traffic channel: {top_channel['channel']} with {int(top_channel['unique_visitors']):,} visitors")
            insights.append(f"• {len(high_conv_channels)} channels show above-median conversion rates")

            # Calculate efficiency metrics
            chan_summary = chan_df.groupby('channel_category').agg({
                'unique_visitors': 'sum',
                'pre_signup_visitors': 'sum'
            }).reset_index()
            chan_summary['efficiency'] = chan_summary['pre_signup_visitors'] / chan_summary['unique_visitors']
            best_category = chan_summary.nlargest(1, 'efficiency').iloc[0]
            insights.append(f"• Most efficient channel category: {best_category['channel_category']} ({best_category['efficiency']:.1%} conversion)")

        # Revenue insights
        if 'revenue_segments' in self.results and not self.results['revenue_segments'].empty:
            rev_df = self.results['revenue_segments']
            total_mrr = rev_df['total_mrr'].sum()
            top_segment = rev_df.iloc[0]

            insights.append(f"• Total MRR across analyzed segments: ${total_mrr:,.0f}")
            insights.append(f"• Top revenue segment: {top_segment['segment']} - {top_segment['plan_tier']} (${top_segment['total_mrr']:,.0f} MRR)")

            # Calculate segment concentration
            segment_summary = rev_df.groupby('segment')['total_mrr'].sum().sort_values(ascending=False)
            if len(segment_summary) > 0:
                top_2_concentration = segment_summary.head(2).sum() / segment_summary.sum() * 100
                insights.append(f"• Revenue concentration: Top 2 segments = {top_2_concentration:.1f}% of MRR")

        # Conversion funnel insights
        if 'signup_conversion' in self.results and not self.results['signup_conversion'].empty:
            conv_df = self.results['signup_conversion']
            recent_weeks = conv_df.head(4)
            avg_conversion = recent_weeks['conversion_rate'].mean()
            avg_mrr_per_conv = recent_weeks['avg_mrr_per_conversion'].mean()

            insights.append(f"• Recent 4-week avg signup→paid conversion: {avg_conversion:.2f}%")
            insights.append(f"• Average MRR per new subscription: ${avg_mrr_per_conv:.2f}")

            # Trend analysis
            if len(conv_df) >= 4:
                recent_trend = conv_df.head(2)['conversion_rate'].mean() - conv_df.iloc[2:4]['conversion_rate'].mean()
                trend_direction = "improving" if recent_trend > 0 else "declining"
                insights.append(f"• Conversion trend: {trend_direction} ({recent_trend:+.2f}% points)")

        # Generate recommendations
        if insights:
            recommendations.append("1. GEOGRAPHIC EXPANSION:")
            recommendations.append("   • Focus marketing investment on high-converting regions identified above")
            recommendations.append("   • Test localized campaigns in underperforming but high-volume regions")

            recommendations.append("\n2. CHANNEL OPTIMIZATION:")
            recommendations.append("   • Reallocate budget toward high-efficiency channels")
            recommendations.append("   • Investigate why certain channels have low conversion despite high traffic")

            recommendations.append("\n3. SEGMENT TARGETING:")
            recommendations.append("   • Develop targeted campaigns for high-value segments")
            recommendations.append("   • Create segment-specific onboarding to improve conversion rates")

            recommendations.append("\n4. CONVERSION FUNNEL:")
            recommendations.append("   • A/B test signup flow improvements in low-converting segments")
            recommendations.append("   • Implement progressive profiling to reduce signup friction")

            recommendations.append("\n5. MONITORING METRICS:")
            recommendations.append("   • Track visitor→signup→paid conversion by cohort weekly")
            recommendations.append("   • Monitor MRR per visitor as a north star efficiency metric")
            recommendations.append("   • Set up alerts for conversion rate changes >10%")

        # Print insights
        print("\n📊 KEY INSIGHTS:")
        for insight in insights:
            print(insight)

        print("\n🎯 RECOMMENDATIONS:")
        for rec in recommendations:
            print(rec)

        return insights, recommendations

    def save_results(self):
        """Save analysis results to files"""
        output_dir = "/Users/rachelwolan/agent-chief-of-staff/analysis/visitor_revenue_output"
        os.makedirs(output_dir, exist_ok=True)

        # Save DataFrames to CSV
        for key, df in self.results.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                filename = f"{output_dir}/{key}_{self.analysis_date}.csv"
                df.to_csv(filename, index=False)
                print(f"Saved {key} to {filename}")

        # Generate summary report
        insights, recommendations = self.generate_insights_and_recommendations()

        report_content = f"""# Webflow Visitor-to-Revenue Analysis Report
Date: {self.analysis_date}

## Executive Summary

This analysis examines visitor-to-revenue conversion patterns across geographic regions, marketing channels, and customer segments for Webflow.

## Key Insights

{chr(10).join(insights)}

## Recommendations

{chr(10).join(recommendations)}

## Data Tables

See accompanying CSV files for detailed data.
"""

        report_file = f"{output_dir}/visitor_revenue_report_{self.analysis_date}.md"
        with open(report_file, 'w') as f:
            f.write(report_content)
        print(f"\nReport saved to {report_file}")

    def run_full_analysis(self):
        """Execute complete visitor-to-revenue analysis"""
        print("\n" + "="*80)
        print("WEBFLOW VISITOR-TO-REVENUE CONVERSION ANALYSIS")
        print("="*80)

        # Run all analyses
        self.analyze_visitor_metrics_by_geography()
        self.analyze_visitor_metrics_by_channel()
        self.analyze_revenue_by_segment()
        self.analyze_signup_to_revenue_conversion()
        self.analyze_geo_channel_crossover()
        self.analyze_visitor_trends()

        # Generate insights and save results
        self.save_results()

        print("\n" + "="*80)
        print("ANALYSIS COMPLETE")
        print("="*80)

if __name__ == "__main__":
    analyzer = WebflowVisitorRevenueAnalyzer()
    analyzer.run_full_analysis()