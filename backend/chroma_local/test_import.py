from memory_manager import store_memory, query_memory

print("✅ Import worked")

# Test storing a memory with correct parameters
try:
    store_memory(
        user_id="test_user_123",
        text="This is a test memory to verify the system works",
        summary="Test memory for system verification",
        tags=["test", "verification", "system_check"],
        voice_path_url=None
    )
    print("✅ Memory storage test passed")
    
    # Test querying memory
    documents, metadata = query_memory("test memory", k=1)
    print("✅ Memory query test passed")
    print(f"Found {len(documents)} memories")
    
except Exception as e:
    print(f"❌ Error during testing: {e}")