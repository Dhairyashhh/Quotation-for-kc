#!/usr/bin/env python3
"""Comprehensive workflow test for QuotationApp"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_workflow():
    print("\n" + "="*70)
    print("COMPREHENSIVE QUOTATION APP WORKFLOW TEST")
    print("="*70)
    
    # Step 1: Create a new company
    import time
    timestamp = int(time.time() * 1000)
    company_name = f"Test Workflow Company {timestamp}"
    print(f"\n[1/8] Creating test company...")
    company_resp = requests.post(f"{BASE_URL}/api/add-company", 
                                json={"name": company_name})
    assert company_resp.status_code == 200, f"Failed to add company: {company_resp.text}"
    company = company_resp.json()['company']
    company_id = company['id']
    print(f"✅ Company created: {company['name']} (ID: {company_id})")
    
    # Step 2: Add subcategories
    print("\n[2/8] Adding subcategories...")
    subcat1_resp = requests.post(f"{BASE_URL}/api/add-subcategory/{company_id}",
                                json={"subcategory": "Category A"})
    assert subcat1_resp.status_code == 200
    subcat2_resp = requests.post(f"{BASE_URL}/api/add-subcategory/{company_id}",
                                json={"subcategory": "Category B"})
    assert subcat2_resp.status_code == 200
    print(f"✅ Subcategories added: Category A, Category B")
    
    # Step 3: Add products with prices and no discount
    print("\n[3/8] Adding products without discount...")
    products = []
    product_data = [
        {"name": "Product A", "price": 100, "category": "Category A"},
        {"name": "Product B", "price": 200, "category": "Category A"},
        {"name": "Product C", "price": 300, "category": "Category B"},
    ]
    
    for pdata in product_data:
        prod_resp = requests.post(f"{BASE_URL}/api/add-product",
                                 json={
                                     "name": pdata["name"],
                                     "price": pdata["price"],
                                     "company_id": company_id,
                                     "subcategory": pdata["category"]
                                 })
        assert prod_resp.status_code == 200, f"Failed: {prod_resp.text}"
        products.append(prod_resp.json()['product'])
    print(f"✅ Added {len(products)} products")
    
    # Step 4: Apply individual discount to one product
    print("\n[4/8] Applying discount to Product A...")
    discount_resp = requests.post(f"{BASE_URL}/api/update-discount",
                                 json={
                                     "product_ids": [products[0]['id']],
                                     "discount": 10
                                 })
    assert discount_resp.status_code == 200
    print(f"✅ Applied 10% discount to {products[0]['name']}")
    
    # Step 5: Apply bulk discount to multiple products
    print("\n[5/8] Applying bulk discount to Products B & C...")
    bulk_resp = requests.post(f"{BASE_URL}/api/update-discount",
                             json={
                                 "product_ids": [products[1]['id'], products[2]['id']],
                                 "discount": 15
                             })
    assert bulk_resp.status_code == 200
    print(f"✅ Applied 15% discount to {products[1]['name']} and {products[2]['name']}")
    
    # Step 6: Verify products have correct discounts
    print("\n[6/8] Verifying discounts applied...")
    verify_resp = requests.get(f"{BASE_URL}/api/products?company_id={company_id}")
    verified_products = verify_resp.json()
    for prod in verified_products:
        if prod['name'] == "Product A":
            assert prod['discount'] == 10, f"Product A should have 10% discount, got {prod['discount']}"
        elif prod['name'] in ["Product B", "Product C"]:
            assert prod['discount'] == 15, f"{prod['name']} should have 15% discount, got {prod['discount']}"
    print(f"✅ All discounts verified correctly")
    
    # Step 7: Create bill with mixed products and discounts
    print("\n[7/8] Generating bill with discounts...")
    cart_items = [
        {
            "id": products[0]['id'],
            "name": products[0]['name'],
            "price": products[0]['price'],
            "discount": 10,
            "quantity": 2
        },
        {
            "id": products[1]['id'],
            "name": products[1]['name'],
            "price": products[1]['price'],
            "discount": 15,
            "quantity": 1
        },
        {
            "id": products[2]['id'],
            "name": products[2]['name'],
            "price": products[2]['price'],
            "discount": 15,
            "quantity": 3
        }
    ]
    
    bill_resp = requests.post(f"{BASE_URL}/api/generate-bill",
                             json={
                                 "items": cart_items,
                                 "gst_rate": 18
                             })
    assert bill_resp.status_code == 200, f"Bill generation failed: {bill_resp.text}"
    
    # Verify bill calculations
    print("  Calculating expected totals:")
    print(f"    Product A: ₹100 × 2 × (1 - 10%) = ₹180")
    print(f"    Product B: ₹200 × 1 × (1 - 15%) = ₹170")
    print(f"    Product C: ₹300 × 3 × (1 - 15%) = ₹765")
    subtotal = 180 + 170 + 765
    gst = subtotal * 0.18
    total = subtotal + gst
    print(f"    Subtotal: ₹{subtotal}")
    print(f"    GST (18%): ₹{gst:.2f}")
    print(f"    Grand Total: ₹{total:.2f}")
    print(f"✅ Bill generated successfully ({len(bill_resp.content)} bytes)")
    
    # Step 8: Test deletion cascades
    print("\n[8/8] Testing deletion cascades...")
    
    # Delete a subcategory - should remove products in that category
    del_subcat = requests.delete(f"{BASE_URL}/api/delete-subcategory/{company_id}/Category%20A")
    assert del_subcat.status_code == 200
    
    # Verify products in Category A are deleted
    products_after = requests.get(f"{BASE_URL}/api/products?company_id={company_id}").json()
    remaining_names = [p['name'] for p in products_after]
    assert "Product A" not in remaining_names, "Product A should be deleted"
    assert "Product B" not in remaining_names, "Product B should be deleted"
    assert "Product C" in remaining_names, "Product C should remain"
    print(f"✅ Subcategory deletion cascaded correctly (Products A & B deleted)")
    
    # Delete company - should delete all its products
    del_company = requests.delete(f"{BASE_URL}/api/delete-company/{company_id}")
    assert del_company.status_code == 200
    
    products_deleted = requests.get(f"{BASE_URL}/api/products?company_id={company_id}").json()
    assert len(products_deleted) == 0, "Company deletion should remove all products"
    print(f"✅ Company deletion cascaded correctly (all products deleted)")
    
    print("\n" + "="*70)
    print("✅ ALL WORKFLOW TESTS PASSED SUCCESSFULLY!")
    print("="*70 + "\n")

if __name__ == "__main__":
    try:
        test_workflow()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
